"""
TextFSM helpers for the TextFSM Parser tool.

- template_info(): Values, rules (with the final regex after ${VALUE} substitution) and states.
- template_check(): unused Values, unreachable states, rules that matched nothing, records dropped
  because a Required Value was empty.
- error_line(): the template line number from a TextFSM error message.
- ntc-templates lookup: list platforms/commands and find the template for "platform + command",
  using TextFSM's own CliTable matching (so abbreviations like "sh ip int br" work).
"""
import functools
import os
import re

STATE_NAMES_SPECIAL = {"Start", "End", "EOF"}


def error_line(message: str):
    m = re.search(r"Line:? (\d+)", message)
    return int(m.group(1)) if m else None


def template_info(parser):
    return {
        "values": [{"name": v.name, "regex": v.regex, "options": [o.name for o in v.options]} for v in parser.values],
        "states": list(parser.state_list),
        "rules": [
            {
                "line": r.line_num,
                "state": state,
                "match": r.match,
                "regex": r.regex,
                "line_op": r.line_op or "",
                "record_op": r.record_op or "",
                "new_state": r.new_state or "",
            }
            for state in parser.state_list
            for r in parser.states[state]
        ],
    }


def template_check(parser, trace, dropped):
    info = template_info(parser)
    rule_text = " ".join(r["match"] for r in info["rules"])
    unused_values = [
        v["name"] for v in info["values"]
        if not re.search(r"\$\{%s\}|\$%s\b" % (re.escape(v["name"]), re.escape(v["name"])), rule_text)
    ]
    targets = {r["new_state"] for r in info["rules"] if r["new_state"]}
    unreachable = [s for s in info["states"] if s not in STATE_NAMES_SPECIAL and s not in targets]
    matched_rules = {t["rule_line"] for t in trace}
    entered = {"Start"} | targets
    unmatched_rules = [
        {"line": r["line"], "state": r["state"], "match": r["match"]}
        for r in info["rules"] if r["line"] not in matched_rules and r["state"] in entered
    ]
    return {
        "unused_values": unused_values,
        "unreachable_states": unreachable,
        "unmatched_rules": unmatched_rules,
        "dropped_records": dropped,
    }


# --- ntc-templates ---------------------------------------------------------------------------

def _ntc():
    try:
        import ntc_templates
    except ImportError:
        return None
    return ntc_templates


def ntc_template_dir():
    ntc = _ntc()
    return os.path.join(os.path.dirname(ntc.__file__), "templates") if ntc else None


def ntc_version():
    try:
        from importlib.metadata import version

        return version("ntc-templates")
    except Exception:
        return None


def _display_command(pattern: str) -> str:
    """'sh[[ow]] ip int[[erface]] br[[ief]]' -> 'show ip interface brief'."""
    return re.sub(r"\[\[(.*?)\]\]", r"\1", pattern).rstrip("$").strip()


@functools.lru_cache(maxsize=1)
def ntc_index():
    """{platform: [{"command": display command, "templates": [...]}, ...]} from the ntc index file."""
    directory = ntc_template_dir()
    if not directory:
        return None
    platforms = {}
    with open(os.path.join(directory, "index"), encoding="utf-8") as fh:
        header_seen = False
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if not header_seen:
                header_seen = True  # "Template, Hostname, Platform, Command"
                continue
            parts = [p.strip() for p in line.split(",", 3)]
            if len(parts) != 4:
                continue
            templates, _hostname, platform, command = parts
            platforms.setdefault(platform, []).append({
                "command": _display_command(command),
                "templates": templates.split(":"),
            })
    for entries in platforms.values():
        entries.sort(key=lambda e: e["command"])
    return dict(sorted(platforms.items()))


@functools.lru_cache(maxsize=1)
def _cli_table():
    from textfsm import clitable

    return clitable.CliTable("index", ntc_template_dir())


def ntc_find(platform: str, command: str):
    """Template file names for a platform and a command (abbreviations allowed), or None."""
    if not ntc_template_dir():
        return None
    table = _cli_table()
    row = table.index.GetRowMatch({"Platform": platform, "Command": command})
    if not row:
        return None
    return [t.strip() for t in table.index.index[row]["Template"].split(":")]


def ntc_read(name: str):
    directory = ntc_template_dir()
    if not directory or not re.fullmatch(r"[\w.-]+\.textfsm", name):
        return None
    path = os.path.join(directory, name)
    if not os.path.isfile(path):
        return None
    with open(path, encoding="utf-8") as fh:
        return fh.read()
