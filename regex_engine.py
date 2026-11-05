"""
Regex Tester engine.

- analyze(): runs Python `re` in a short-lived subprocess with a time limit, so a catastrophic
  pattern such as (a+)+$ cannot lock up the web server.
- portability(): says whether a pattern behaves the same in other regex flavours
  (GNU grep -E / -P, Cisco IOS/IOS-XE), using the real grep binary where available
  and rules for the rest.
"""
import json
import os
import re
import shutil
import subprocess
import sys
import warnings

try:  # Python 3.11+
    from re import _constants as sre_c
    from re import _parser as sre_parse
except ImportError:  # pragma: no cover - older Python
    import sre_constants as sre_c
    import sre_parse

TIMEOUT_SECONDS = 2.0
MAX_MATCHES = 1000
FLAG_MAP = {"i": re.IGNORECASE, "m": re.MULTILINE, "s": re.DOTALL, "x": re.VERBOSE}


class RegexTimeout(Exception):
    pass


def flag_bits(flags: str) -> int:
    bits = 0
    for ch in flags or "":
        bits |= FLAG_MAP.get(ch, 0)
    return bits


# --- Python matching (runs in the worker process) -----------------------------

def _analyze(pattern: str, text: str, flags: str, replacement):
    with warnings.catch_warnings(record=True) as caught:
        warnings.simplefilter("always")
        compiled = re.compile(pattern, flag_bits(flags))
    matches = []
    truncated = False
    for m in compiled.finditer(text):
        if len(matches) >= MAX_MATCHES:
            truncated = True
            break
        item = {
            "match": m.group(0),
            "start": m.start(),
            "end": m.end(),
            "groups": list(m.groups()),
            "spans": [list(m.span(i)) if m.start(i) != -1 else None for i in range(1, compiled.groups + 1)],
        }
        if compiled.groupindex:
            item["named"] = m.groupdict()
        matches.append(item)
    result = {
        "count": len(matches),
        "truncated": truncated,
        "matches": matches,
        "group_names": {str(v): k for k, v in compiled.groupindex.items()},
        # Lines that contain a match, as grep would count them.
        "matching_lines": sum(1 for line in text.split("\n") if compiled.search(line)),
        "warnings": [str(w.message) for w in caught],
    }
    if replacement is not None:
        replaced, n = compiled.subn(replacement, text)
        result["replaced"] = replaced
        result["replace_count"] = n
    return result


def analyze(pattern: str, text: str, flags: str = "", replacement=None, timeout: float = None):
    """
    Run the pattern in a separate Python process with a time limit. Raises re.error for a bad
    pattern, or RegexTimeout if matching takes too long (the process is killed).
    """
    timeout = TIMEOUT_SECONDS if timeout is None else timeout
    with warnings.catch_warnings():  # warnings are reported by the worker instead
        warnings.simplefilter("ignore")
        re.compile(pattern, flag_bits(flags))  # syntax errors are raised here, quickly, in-process
    payload = json.dumps({"pattern": pattern, "text": text, "flags": flags, "replacement": replacement})
    try:
        proc = subprocess.run(
            [sys.executable, "-I", "-S", "-X", "utf8", os.path.abspath(__file__), "--worker"],
            input=payload, capture_output=True, text=True, encoding="utf-8", timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        raise RegexTimeout(
            f"The pattern took longer than {timeout:g}s and was stopped. This usually means catastrophic "
            "backtracking: nested quantifiers like (a+)+ or (.*)* on text that almost matches. "
            "Make the pattern more specific."
        )
    if proc.returncode != 0:
        last = (proc.stderr.strip().splitlines() or ["regex worker failed"])[-1]
        raise RuntimeError(last)
    return json.loads(proc.stdout)


# --- Portability ---------------------------------------------------------------

def _walk(items, found):
    """Collect the regex features used by a parsed pattern."""
    possessive = getattr(sre_c, "POSSESSIVE_REPEAT", None)
    atomic = getattr(sre_c, "ATOMIC_GROUP", None)
    for op, av in items:
        if op is sre_c.IN:
            for sub_op, sub_av in av:
                if sub_op is sre_c.CATEGORY:
                    _category(sub_av, found)
                elif sub_op is sre_c.LITERAL and sub_av == 10:
                    found.add("newline")
        elif op is sre_c.CATEGORY:
            _category(av, found)
        elif op is sre_c.LITERAL:
            if av == 10:
                found.add("newline")
            elif av == ord("_"):
                found.add("underscore")
        elif op is sre_c.AT:
            if av in (sre_c.AT_BEGINNING, sre_c.AT_END):
                found.add("line_anchor")
            elif av in (sre_c.AT_BEGINNING_STRING, sre_c.AT_END_STRING):
                found.add("string_anchor")
            elif av in (sre_c.AT_BOUNDARY, sre_c.AT_NON_BOUNDARY):
                found.add("boundary")
        elif op in (sre_c.MAX_REPEAT, sre_c.MIN_REPEAT) or (possessive is not None and op is possessive):
            lo, hi, item = av
            if op is sre_c.MIN_REPEAT:
                found.add("lazy")
            elif op is not sre_c.MAX_REPEAT:
                found.add("possessive")
            if (lo, hi) not in ((0, sre_c.MAXREPEAT), (1, sre_c.MAXREPEAT), (0, 1)):
                found.add("interval")
            _walk(item, found)
        elif atomic is not None and op is atomic:
            found.add("possessive")
            _walk(av, found)
        elif op is sre_c.SUBPATTERN:
            group, _add, _del, item = av
            if group is None:
                found.add("noncapture")
            _walk(item, found)
        elif op is sre_c.BRANCH:
            for branch in av[1]:
                _walk(branch, found)
        elif op in (sre_c.ASSERT, sre_c.ASSERT_NOT):
            found.add("lookaround")
            _walk(av[1], found)
        elif op is sre_c.GROUPREF:
            found.add("backref")
        elif op is sre_c.GROUPREF_EXISTS:
            found.add("conditional")
            _walk(av[1], found)
            if av[2] is not None:
                _walk(av[2], found)


def _category(code, found):
    if code in (sre_c.CATEGORY_DIGIT, sre_c.CATEGORY_NOT_DIGIT):
        found.add("digit")
    elif code in (sre_c.CATEGORY_WORD, sre_c.CATEGORY_NOT_WORD, sre_c.CATEGORY_SPACE, sre_c.CATEGORY_NOT_SPACE):
        found.add("word_space")


def features(pattern: str, flags: str = "") -> set:
    """Features used by the pattern (empty set if Python cannot parse it)."""
    found = set()
    if re.search(r"\[\[:\w+:\]\]", pattern):
        found.add("posix_class")
    if re.search(r"\(\?[aiLmsux-]+[:)]", pattern):
        found.add("inline_flags")
    if "(?P<" in pattern or "(?<" in pattern.replace("(?<=", "").replace("(?<!", ""):
        found.add("named_group")
    if "?" in pattern:
        found.add("question_mark")
    if "(?:" in pattern:  # Python's parser flattens simple (?:...) groups, so check the text too
        found.add("noncapture")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            _walk(sre_parse.parse(pattern, flag_bits(flags)), found)
    except Exception:
        pass
    return found


OK, WARN, ERROR = "ok", "warn", "error"
NOTE = None  # a hint that does not change the verdict

# feature -> (level, hint) per flavour. Features not listed are fine in that flavour.
RULES = {
    "grep_e": {
        "digit": (ERROR, r"\d is not supported and silently matches a literal 'd'. Use [0-9]."),
        "word_space": (WARN, r"\w, \s work in GNU grep but not in POSIX/BSD grep. Portable: [[:alnum:]_], [[:space:]]."),
        "boundary": (WARN, r"\b works in GNU grep only."),
        "string_anchor": (ERROR, r"\A and \Z are not supported. Use ^ and $ (grep matches line by line)."),
        "lazy": (ERROR, "Lazy quantifiers (+? *?) are not supported: 'a+?' means 'optional a+' in ERE and matches far more."),
        "possessive": (ERROR, "Possessive quantifiers and atomic groups are not supported."),
        "lookaround": (ERROR, "Lookarounds (?= (?! (?<= (?<! are not supported. Use grep -P."),
        "noncapture": (ERROR, "(?:...) is not supported. Use a plain group (...)."),
        "named_group": (ERROR, "Named groups are not supported. Use a plain group (...)."),
        "inline_flags": (ERROR, "Inline flags like (?i) are not supported. Use grep -i for ignore case."),
        "newline": (ERROR, r"grep matches one line at a time, so \n never matches."),
        "conditional": (ERROR, "Conditional groups are not supported."),
    },
    "grep_p": {
        "newline": (ERROR, r"grep matches one line at a time, so \n never matches."),
    },
    "cisco": {
        "digit": (ERROR, r"\d is not supported. Use [0-9]."),
        "word_space": (ERROR, r"\w and \s are not supported. Use [a-zA-Z0-9_] or a literal space (or _ for any separator)."),
        "boundary": (ERROR, r"\b is not supported. Use _ to match a separator."),
        "string_anchor": (ERROR, r"\A and \Z are not supported. Use ^ and $."),
        "lazy": (ERROR, "Lazy quantifiers (+? *?) are not supported."),
        "possessive": (ERROR, "Possessive quantifiers and atomic groups are not supported."),
        "lookaround": (ERROR, "Lookarounds are not supported."),
        "noncapture": (ERROR, "(?:...) is not supported. Use a plain group (...)."),
        "named_group": (ERROR, "Named groups are not supported."),
        "inline_flags": (ERROR, "Inline flags like (?i) are not supported."),
        "newline": (ERROR, r"IOS matches one line (or one AS path) at a time, so \n never matches."),
        "posix_class": (ERROR, "POSIX classes like [[:digit:]] are not supported. Use [0-9]."),
        "conditional": (ERROR, "Conditional groups are not supported."),
        "interval": (WARN, "{n,m} repeat counts may not be supported on every IOS release. Repeat the item instead, e.g. [0-9][0-9]?[0-9]?"),
        "underscore": (NOTE, "In IOS, _ matches any separator (space, comma, braces, start or end of string), not just an underscore. "
                             "This tester treats _ as a literal underscore, so its results differ."),
        "question_mark": (NOTE, "On the IOS CLI, press Ctrl+V before typing ?, otherwise it opens the help."),
    },
    "python": {
        "posix_class": (WARN, "Python does not support POSIX classes like [[:digit:]]: they are read as a plain character set. Use \\d or [0-9]."),
    },
}

LEVEL_ORDER = {OK: 0, WARN: 1, ERROR: 2}


def _worst(levels):
    return max(levels, key=LEVEL_ORDER.get, default=OK)


def _apply_rules(flavour, found):
    hits = [RULES[flavour][f] for f in sorted(found) if f in RULES[flavour]]
    return _worst([lvl for lvl, _ in hits if lvl is not NOTE]), [hint for _, hint in hits]


def _grep_binary():
    return shutil.which("grep")


def _grep_version(binary):
    try:
        out = subprocess.run([binary, "-V"], capture_output=True, text=True, timeout=2).stdout
        return out.splitlines()[0] if out else ""
    except Exception:
        return ""


def _run_grep(binary, mode, pattern, text, flags):
    """Count matching lines with the real grep. Returns (count or None, stderr text)."""
    args = [binary, "-c", mode]
    if "i" in (flags or ""):
        args.append("-i")
    if mode == "-P" and any(f in (flags or "") for f in "sx"):
        pattern = "(?" + "".join(f for f in "sx" if f in flags) + ")" + pattern
    args += ["--", pattern]
    try:
        proc = subprocess.run(args, input=text, capture_output=True, text=True, timeout=TIMEOUT_SECONDS)
    except subprocess.TimeoutExpired:
        return None, "grep took too long and was stopped."
    stderr = proc.stderr.strip().replace(binary + ": ", "")
    if proc.returncode == 2:
        return None, stderr or "grep reported an error."
    try:
        return int(proc.stdout.strip() or 0), stderr
    except ValueError:
        return None, stderr


def portability(pattern: str, flags: str = "", text: str = "", python_lines=None, python_error=None):
    """List of per-flavour verdicts: {id, label, level, engine, summary, hints}."""
    found = features(pattern, flags)
    results = []

    # Python and everything built on it.
    if python_error:
        py_level, py_hints = ERROR, [python_error]
    else:
        py_level, py_hints = _apply_rules("python", found)
        multiline = "m" in (flags or "") or re.search(r"\(\?[aiLsux]*m", pattern)
        if "line_anchor" in found and "\n" in (text or "") and not multiline:
            py_hints.append("^ and $ match the start and end of the whole text here (Python's default). "
                            "Tick m (multiline) to match each line, like grep and IOS do.")
    results.append({
        "id": "python",
        "label": "Python · Ansible · TextFSM · TTP · Netmiko",
        "level": py_level,
        "engine": "tested",
        "summary": "These all use Python's re module, so they behave exactly like this tester."
        if py_level == OK else ("Pattern error in Python." if python_error else "Works, with a caveat."),
        "hints": py_hints,
    })

    binary = _grep_binary()
    version = _grep_version(binary) if binary else ""
    for flavour, mode, label in (("grep_p", "-P", "grep -P (PCRE)"), ("grep_e", "-E", "grep -E · sed -E · awk (POSIX ERE)")):
        level, hints = _apply_rules(flavour, found)
        engine = "rules"
        summary = ""
        if binary and text:
            count, stderr = _run_grep(binary, mode, pattern, text, flags)
            engine = "tested"
            if count is None:
                level, summary = ERROR, "grep rejected the pattern."
                hints = [stderr] + hints
            else:
                if stderr:
                    level = _worst([level, WARN])
                    hints = [stderr] + hints
                if python_lines is not None and count != python_lines:
                    level = _worst([level, WARN])
                    summary = f"Matches {count} line(s); Python matches {python_lines}."
                else:
                    summary = f"Matches {count} line(s), same as Python." if python_lines is not None else f"Matches {count} line(s)."
        if "m" in (flags or "") or ("s" in (flags or "") and mode == "-E") or ("x" in (flags or "") and mode == "-E"):
            hints.append("grep matches line by line, so the m (and for -E: s, x) flags have no equivalent.")
        if not summary:
            summary = {OK: "Uses only syntax this flavour supports.", WARN: "Probably works; see the notes.",
                       ERROR: "Uses syntax this flavour does not support."}[level]
        if engine == "tested" and version:
            summary += f" (tested with {version})"
        elif not binary:
            summary += " (grep not found on this machine: rule-based check only)"
        results.append({"id": flavour, "label": label, "level": level, "engine": engine, "summary": summary, "hints": hints})

    level, hints = _apply_rules("cisco", found)
    if "i" in (flags or ""):
        level = _worst([level, WARN])
        hints.append("IOS regex is case-sensitive and has no ignore-case option.")
    if any(f in (flags or "") for f in "msx"):
        hints.append("IOS has no equivalent of the m, s or x flags.")
    results.append({
        "id": "cisco",
        "label": "Cisco IOS/IOS-XE (CLI filters, BGP AS-path and community lists)",
        "level": level,
        "engine": "rules",
        "summary": {OK: "Uses only basic syntax IOS supports.", WARN: "Probably works; see the notes.",
                    ERROR: "Uses syntax IOS does not support."}[level] + " (rule-based check: no IOS engine here)",
        "hints": hints,
    })
    return results


if __name__ == "__main__" and sys.argv[1:] == ["--worker"]:
    # Worker mode: read the job as JSON on stdin, write the result as JSON on stdout.
    job = json.load(sys.stdin)
    json.dump(_analyze(job["pattern"], job["text"], job["flags"], job["replacement"]), sys.stdout)
