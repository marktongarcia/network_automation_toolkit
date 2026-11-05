"""
Extra data for the hover tooltips in the UI.

- jinja_segments(): which template line produced each piece of rendered output.
- TracingTextFSM: which rule matched each input line, and where each Value was captured.
"""
import re

import textfsm
from jinja2 import nodes

_MARK_RE = re.compile("\x00(\\d+):(-?\\d+)\x01")

# Statements whose bodies are rendered straight into the output. Output inside macros,
# call blocks, filter blocks and {% set %} blocks is captured into a value first, so it
# is left alone (a marker there could change the value) and is attributed to the line
# that uses it.
_DIRECT_BODY_NODES = (nodes.For, nodes.If, nodes.With, nodes.Scope, nodes.ScopedEvalContextModifier)


def _mark(body, counters):
    """
    Put a marker before every piece of output: "line:-1" for literal template text, "line:k"
    for the k-th {{ expression }} on that template line (counted in source order).
    """
    for node in body:
        if isinstance(node, nodes.Output):
            marked = []
            for child in node.nodes:
                if isinstance(child, nodes.TemplateData):
                    ordinal = -1
                else:
                    ordinal = counters.get(child.lineno, 0)
                    counters[child.lineno] = ordinal + 1
                marked.append(nodes.TemplateData(f"\x00{child.lineno}:{ordinal}\x01", lineno=child.lineno))
                marked.append(child)
            node.nodes = marked
        elif isinstance(node, _DIRECT_BODY_NODES):
            # Source order: body, then elif branches, then else.
            _mark(node.body, counters)
            for elif_node in getattr(node, "elif_", None) or []:
                _mark(elif_node.body, counters)
            if getattr(node, "else_", None):
                _mark(node.else_, counters)


def jinja_segments(env, template_text, variables, expected_output, postprocess=None):
    """
    Render a marked copy of the template and return [[template_line, text, ordinal], ...]
    covering the whole output. ordinal is None for literal template text, or k for text produced
    by the k-th {{ expression }} on that line. Returns None if the mapping cannot be trusted
    (the marked output must equal the normal output once the markers are removed).
    """
    try:
        ast = env.parse(template_text)
        _mark(ast.body, {})
        marked = env.from_string(ast).render(**variables)
        if postprocess:
            marked = postprocess(marked)
    except Exception:
        return None
    if _MARK_RE.sub("", marked) != expected_output:
        return None

    segments = []

    def add(line, text, ordinal):
        if not text:
            return
        last = segments[-1] if segments else None
        if last and last[0] == line and last[2] == ordinal:
            last[1] += text
        else:
            segments.append([line, text, ordinal])

    pos = 0
    line, ordinal = None, None
    for m in _MARK_RE.finditer(marked):
        _emit(add, marked[pos:m.start()], line, ordinal)
        line, k = int(m.group(1)), int(m.group(2))
        ordinal = None if k < 0 else k
        pos = m.end()
    _emit(add, marked[pos:], line, ordinal)
    return segments


def _emit(add, text, line, ordinal):
    if not text:
        return
    if ordinal is not None or line is None:
        add(line, text, ordinal)
        return
    # Literal template text: each newline in it moves to the next template line.
    parts = text.split("\n")
    for i, part in enumerate(parts):
        last = i == len(parts) - 1
        add(line + i, part if last else part + "\n", None)


class TracingTextFSM(textfsm.TextFSM):
    """TextFSM that records, per input line, the rule that matched and the captured Values."""

    def __init__(self, template):
        super().__init__(template)
        self.trace = []
        self.dropped = []  # records lost because a Required Value was empty
        self._line_index = -1

    def _AppendRecord(self):
        required_empty = [v.name for v in self.values if "Required" in [o.name for o in v.options] and not v.value]
        captured = {v.name: v.value for v in self.values
                    if v.value and "Filldown" not in [o.name for o in v.options]}
        before = len(self._result)
        super()._AppendRecord()
        if len(self._result) == before and required_empty and captured and len(self.dropped) < 50:
            self.dropped.append({"line": self._line_index, "required": required_empty, "values": captured})

    def _CheckLine(self, line):
        # Same logic as textfsm.TextFSM._CheckLine (textfsm 1.1.3), plus recording.
        self._line_index += 1
        for rule in self._cur_state:
            matched = self._CheckRule(rule, line)
            if matched:
                state = self._cur_state_name
                record_index = len(self._result)
                values = {}
                for name in matched.groupdict():
                    if matched.group(name) is not None and matched.start(name) != -1:
                        values[name] = [matched.start(name), matched.end(name), matched.group(name)]
                for value in matched.groupdict():
                    self._AssignVar(matched, value)

                action = ".".join(op for op in (rule.line_op, rule.record_op) if op)
                if rule.new_state:
                    action = f"{action} -> {rule.new_state}".strip()
                self.trace.append({
                    "line": self._line_index,
                    "state": state,
                    "rule": rule.match,
                    "rule_line": rule.line_num,
                    "action": action,
                    "values": values,
                    "record": record_index,
                })

                if self._Operations(rule, line):
                    if rule.new_state:
                        if rule.new_state not in ("End", "EOF"):
                            self._cur_state = self.states[rule.new_state]
                        self._cur_state_name = rule.new_state
                    break


# --- J2 variables check and reference -----------------------------------------------------

def inspect_template(env, template_text, variables, netbox_names=()):
    """
    Compare what the template uses with the variables provided.

    - missing: undefined values that actually reach the output or a loop, found by a test render
      that records them (with the template line). Optional values that are only tested with
      {% if %}, `is defined` or `| default` are not reported.
    - not_provided: top-level names the template references but the variables lack (handled by
      the template, since they did not show up in `missing`).
    - unused: variables provided but never referenced.
    - netbox: names that NetBox itself supplies when the template renders inside NetBox.
    """
    import sys

    from jinja2 import Undefined, meta

    try:
        ast = env.parse(template_text)
    except Exception:
        return None
    referenced = set(meta.find_undeclared_variables(ast))
    provided = set(variables) if isinstance(variables, dict) else set()
    known = set(env.globals)

    missing, seen = [], set()
    holder = {}

    def where():
        frame = sys._getframe(2)
        while frame is not None and frame.f_code.co_filename != "<template>":
            frame = frame.f_back
        if frame is None or "t" not in holder:
            return None
        return holder["t"].get_corresponding_lineno(frame.f_lineno)

    def record(undefined, kind):
        key = (undefined._undefined_message, kind)
        line = where()
        if (key, line) in seen or len(missing) >= 50:
            return
        seen.add((key, line))
        missing.append({"line": line, "message": undefined._undefined_message, "kind": kind})

    class RecordingUndefined(Undefined):
        __slots__ = ()

        def __str__(self):
            record(self, "output")
            return ""

        def __iter__(self):
            record(self, "loop")
            return iter(())

    probe_error = None
    try:
        probe = env.overlay(undefined=RecordingUndefined)
        holder["t"] = probe.from_string(template_text)
        holder["t"].render(**(variables if isinstance(variables, dict) else {}))
    except Exception as exc:
        line = None
        tb = exc.__traceback__
        while tb is not None:
            if tb.tb_frame.f_code.co_filename == "<template>":
                line = tb.tb_lineno
            tb = tb.tb_next
        probe_error = {"line": line, "message": f"{type(exc).__name__}: {exc}"}

    netbox = sorted(n for n in referenced if n in set(netbox_names) and n not in provided)
    undefined_names = {m["message"].split("'")[1] for m in missing if m["message"].endswith(" is undefined")}
    not_provided = sorted(referenced - provided - known - set(netbox) - undefined_names)
    return {
        "missing": missing,
        "not_provided": not_provided,
        "unused": sorted(provided - referenced),
        "netbox": netbox,
        "probe_error": probe_error,
    }


def _signature(func, skip_value=True):
    import inspect

    try:
        params = list(inspect.signature(func).parameters.values())
    except (TypeError, ValueError):
        return ""
    if getattr(func, "jinja_pass_arg", None) is not None and params:
        params = params[1:]  # environment / context argument added by Jinja
    if skip_value and params:
        params = params[1:]  # the value on the left of the |
    parts = []
    for p in params:
        if p.kind is p.VAR_POSITIONAL:
            parts.append(f"*{p.name}")
        elif p.kind is p.VAR_KEYWORD:
            parts.append(f"**{p.name}")
        elif p.default is p.empty:
            parts.append(p.name)
        else:
            parts.append(f"{p.name}={p.default!r}")
    return f"({', '.join(parts)})" if parts else ""


def _doc(func, limit=700):
    import inspect

    doc = inspect.getdoc(func) or ""
    keep = []
    for raw in doc.split("\n\n"):
        # Skip code examples (indented) and reST directives (.. sourcecode::, .. versionadded::).
        if raw.startswith((" ", "\t")) or raw.lstrip().startswith(".."):
            continue
        para = " ".join(raw.split())
        if not para or para.startswith(("{%", "{{", ">>>")):
            continue
        para = re.sub(r":\w+:`~?([^`]*)`", lambda m: m.group(1).split(".")[-1], para)  # :class:`~jinja2.X` -> X
        para = para.replace("``", "").replace("`", "")
        para = re.sub(r":param (\w+):", r"\1:", para)
        # Drop sentences that only make sense next to the (omitted) example.
        sentences = [s for s in re.split(r"(?<=[.!?])\s+", para)
                     if not s.lower().startswith(("this will output", "imagine", "the basic usage", "example usage"))
                     and not s.lower().rstrip(".:").endswith("such as")]
        para = " ".join(sentences).strip()
        if para.endswith(":"):  # "...the optional parameter:" introduced an example
            para = para[:-1] + "."
        if para:
            keep.append(para)
    text = " ".join(keep[:3])
    return text if len(text) <= limit else text[: limit - 1] + "…"


def jinja_reference(env):
    """Signatures and docs for every filter and test, straight from the installed Jinja."""
    return {
        "filters": {name: {"signature": _signature(f), "doc": _doc(f)} for name, f in sorted(env.filters.items())},
        "tests": {name: {"signature": _signature(f), "doc": _doc(f)} for name, f in sorted(env.tests.items())},
    }


# --- Which variables the template actually uses -------------------------------------------

_WHOLE_USE_METHODS = {"items", "keys", "values", "get", "__iter__"}


def variable_usage(env, template_text, variables, variables_text):
    """
    Render once while recording every attribute/item lookup into the variables (including the
    ones filters such as map(attribute=...) or selectattr make), then report each key in the
    variables text as used or unused, with the template lines that used it.

    Returns {"keys": [{start, end, path, used, lines}], "unused": [path patterns]} or None.
    Positions are code-point offsets into variables_text (found with PyYAML, which also reads
    JSON). A container the template uses as a whole ({{ x | tojson }}, iterating x.items())
    counts as using all of its keys.
    """
    import sys

    import yaml
    from jinja2 import Undefined, meta

    if not isinstance(variables, dict):
        return None
    try:
        ast = env.parse(template_text)
        root = yaml.compose(variables_text)
    except Exception:
        return None

    paths = {}

    def index(value, path):
        if isinstance(value, dict):
            paths[id(value)] = path
            for k, v in value.items():
                index(v, path + (str(k),))
        elif isinstance(value, list):
            paths[id(value)] = path
            for i, v in enumerate(value):
                index(v, path + (i,))

    for key, value in variables.items():
        index(value, (str(key),))

    accessed = {}  # path -> set of template lines
    whole = set()
    holder = {}

    def line_now():
        frame = sys._getframe(2)
        while frame is not None and frame.f_code.co_filename != "<template>":
            frame = frame.f_back
        if frame is None or "t" not in holder:
            return None
        return holder["t"].get_corresponding_lineno(frame.f_lineno)

    def note(obj, key):
        base = paths.get(id(obj))
        if base is None:
            return
        line = line_now()
        if isinstance(key, str) and key in _WHOLE_USE_METHODS and not (isinstance(obj, dict) and key in obj):
            whole.add(base)
            accessed.setdefault(base, set()).add(line)
            return
        if isinstance(obj, list) and isinstance(key, int):
            key = key if key >= 0 else len(obj) + key
        path = base + ((str(key) if isinstance(obj, dict) else key),)
        accessed.setdefault(path, set()).add(line)

    probe = env.overlay(undefined=Undefined)
    cls = type(env)

    def tracking_getattr(obj, attribute):
        note(obj, attribute)
        return cls.getattr(probe, obj, attribute)

    def tracking_getitem(obj, argument):
        note(obj, argument)
        return cls.getitem(probe, obj, argument)

    probe.getattr = tracking_getattr
    probe.getitem = tracking_getitem
    try:
        holder["t"] = probe.from_string(template_text)
        holder["t"].render(**variables)
    except Exception:
        pass  # usage collected so far is still useful

    referenced = set(meta.find_undeclared_variables(ast))
    for name in referenced:
        if name in variables:
            accessed.setdefault((str(name),), set())
    # Lines where top-level variables are named (they are looked up directly, not via getattr).
    from jinja2 import nodes as jnodes
    for node in ast.find_all(jnodes.Name):
        if node.ctx == "load" and node.name in referenced and node.name in variables:
            accessed[(str(node.name),)].add(node.lineno)

    def has_child_access(path):
        n = len(path)
        return any(len(p) > n and p[:n] == path for p in accessed)

    def is_used(path):
        if path in accessed or has_child_access(path):
            return True
        # Used as a whole: an ancestor was accessed but none of its keys were picked out.
        for n in range(len(path) - 1, 0, -1):
            parent = path[:n]
            if parent in whole:
                # .items()/.keys()/.values()/.get() reach the direct keys; deeper keys are tracked.
                return len(path) == n + 1
            if parent in accessed and not has_child_access(parent):
                return True
            if has_child_access(parent):
                return False
        return False

    def lines_for(path):
        # The key's own lines and its children's; if it was only used as part of a whole
        # container, the lines where that container was used.
        own = set()
        for p, ls in accessed.items():
            if p[: len(path)] == path:
                own |= {ln for ln in ls if ln}
        if own:
            return sorted(own)
        for n in range(len(path) - 1, 0, -1):
            if path[:n] in accessed:
                return sorted(ln for ln in accessed[path[:n]] if ln)
        return []

    keys = []
    unused_patterns = []

    def walk(node, path, parent_unused):
        if isinstance(node, yaml.MappingNode):
            for key_node, value_node in node.value:
                p = path + (str(key_node.value),)
                used = is_used(p)
                keys.append({
                    "start": key_node.start_mark.index,
                    "end": key_node.end_mark.index,
                    "path": list(p),
                    "used": used,
                    "lines": lines_for(p) if used else [],
                })
                if not used and not parent_unused:
                    pattern = "".join(f"[{s}]" if isinstance(s, int) else (f".{s}" if i else s) for i, s in enumerate(p))
                    pattern = re.sub(r"\[\d+\]", "[]", pattern)
                    if pattern not in unused_patterns:
                        unused_patterns.append(pattern)
                walk(value_node, p, parent_unused or not used)
        elif isinstance(node, yaml.SequenceNode):
            for i, item in enumerate(node.value):
                walk(item, path + (i,), parent_unused)

    walk(root, (), False)
    # A pattern like interfaces[].mask is only "unused" if no item uses it.
    used_patterns = {re.sub(r"\[\d+\]", "[]", "".join(f"[{s}]" if isinstance(s, int) else (f".{s}" if i else s) for i, s in enumerate(k["path"]))) for k in keys if k["used"]}
    return {"keys": keys, "unused": [p for p in unused_patterns if p not in used_patterns]}
