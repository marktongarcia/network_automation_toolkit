"""
Extra data for the hover tooltips in the UI.

- jinja_segments(): which template line produced each piece of rendered output.
- TracingTextFSM: which rule matched each input line, and where each Value was captured.
"""
import re

import textfsm
from jinja2 import nodes

_MARK_RE = re.compile("\x00(\\d+):([01])\x01")

# Statements whose bodies are rendered straight into the output. Output inside macros,
# call blocks, filter blocks and {% set %} blocks is captured into a value first, so it
# is left alone (a marker there could change the value) and is attributed to the line
# that uses it.
_DIRECT_BODY_NODES = (nodes.For, nodes.If, nodes.With, nodes.Scope, nodes.ScopedEvalContextModifier)


def _mark(body):
    for node in body:
        if isinstance(node, nodes.Output):
            marked = []
            for child in node.nodes:
                is_data = 1 if isinstance(child, nodes.TemplateData) else 0
                marked.append(nodes.TemplateData(f"\x00{child.lineno}:{is_data}\x01", lineno=child.lineno))
                marked.append(child)
            node.nodes = marked
        elif isinstance(node, _DIRECT_BODY_NODES):
            for attr in ("body", "else_"):
                if getattr(node, attr, None):
                    _mark(getattr(node, attr))
            for elif_node in getattr(node, "elif_", None) or []:
                _mark(elif_node.body)


def jinja_segments(env, template_text, variables, expected_output, postprocess=None):
    """
    Render a marked copy of the template and return [[template_line, text], ...] covering the
    whole output, or None if the mapping cannot be trusted (the marked output must equal the
    normal output once the markers are removed).
    """
    try:
        ast = env.parse(template_text)
        _mark(ast.body)
        marked = env.from_string(ast).render(**variables)
        if postprocess:
            marked = postprocess(marked)
    except Exception:
        return None
    if _MARK_RE.sub("", marked) != expected_output:
        return None

    segments = []

    def add(line, text):
        if not text:
            return
        if segments and segments[-1][0] == line:
            segments[-1][1] += text
        else:
            segments.append([line, text])

    pos = 0
    line, is_data = None, False
    for m in _MARK_RE.finditer(marked):
        _emit(add, marked[pos:m.start()], line, is_data)
        line, is_data = int(m.group(1)), m.group(2) == "1"
        pos = m.end()
    _emit(add, marked[pos:], line, is_data)
    return segments


def _emit(add, text, line, is_data):
    if not text:
        return
    if not is_data or line is None:
        add(line, text)
        return
    # Literal template text: each newline in it moves to the next template line.
    parts = text.split("\n")
    for i, part in enumerate(parts):
        last = i == len(parts) - 1
        add(line + i, part if last else part + "\n")


class TracingTextFSM(textfsm.TextFSM):
    """TextFSM that records, per input line, the rule that matched and the captured Values."""

    def __init__(self, template):
        super().__init__(template)
        self.trace = []
        self._line_index = -1

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
