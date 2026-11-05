"""
The Regex Tester explains patterns in the browser (explainRegex in static/app.js). These tests run
that JavaScript with Node and check it agrees with Python's own compiler on which patterns are valid
and how capturing groups are numbered.
"""
import json
import re
import shutil
import subprocess
import warnings
from pathlib import Path

import pytest

APP_JS = Path(__file__).resolve().parent.parent / "static" / "app.js"

PATTERNS = [
 "interface (\\S+)",
 "(?ms)^interface\\s+(\\S+)\\n\\s+ip address\\s+(\\d+\\.\\d+\\.\\d+\\.\\d+)\\s+(\\d+\\.\\d+\\.\\d+\\.\\d+)\\n\\s+description\\s+(.+?)\\n!",
 "(?P<intf>Gi\\S+)\\s+(?P<ip>[\\d.]+)",
 "(?P<a>x)(?P=a)",
 "(a)(b)\\2\\1",
 "(?:a|b)+",
 "a|b|c",
 "a||b",
 "(a|)",
 "[a-z0-9_-]+",
 "[^\\s,]+",
 "[]a]",
 "[^]a]",
 "[\\]x]",
 "\\d{1,3}(?:\\.\\d{1,3}){3}",
 "a{2}",
 "a{2,}",
 "a{,3}",
 "a{2,3}?",
 "a{3,2}",
 "a{}",
 "x{a}",
 "a*+",
 "(?>a+)b",
 "(?=foo)",
 "(?!bar)x",
 "(?<=\\$)\\d+",
 "(?<!x)y",
 "(?i)cisco",
 "(?i:cisco)IOS",
 "(?x) a b # comment\n c",
 "(?#note)abc",
 "(a)?(?(1)b|c)",
 "\\bword\\b",
 "\\Aabc\\Z",
 "^65001_[0-9]+$",
 "_65001_",
 "\\x41\\u00e9",
 "\\0",
 "\\101",
 "[\\d\\w]",
 "[[:digit:]]+",
 "\\.",
 "a.b",
 "(",
 ")",
 "a)",
 "[abc",
 "*a",
 "+",
 "a**",
 "\\q",
 "\\",
 "(?<name>x)",
 "(?P<n>x)(?P=m)",
 "\\3(a)",
 "(a)\\1",
 "(?P<n>a)|(?P<m>b)",
 "x(?i)y",
 "(?-i:a)",
 "(?s:.)",
 "[z-a]",
 "[a-\\d]",
 "((a)(b(c)))",
 "(?:(?:(a)))",
 "\\N{LATIN SMALL LETTER A}",
 "a{1,2}{3}",
 "(?x)[ a]",
 "(?x)\\ a",
 "\\w+@\\w+\\.com",
 "^\\s*$",
 "(\\d+)\\s+(\\w+)\\s+([\\d.]+)",
 "[\\w.-]+",
 "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b"
]

RUNNER = r"""
const fs = require('fs');
const src = fs.readFileSync(process.argv[1], 'utf8');
const start = src.indexOf('const RX_ESCAPES');
const end = src.indexOf('function renderRegexExplanation');
eval(src.slice(start, end).replace(/^const /gm, 'var '));
const patterns = JSON.parse(fs.readFileSync(0, 'utf8'));
process.stdout.write(JSON.stringify(patterns.map((p) => {
  const r = explainRegex(p, '');
  return { groups: r.groupCount, errors: r.errors.map((e) => e.message), rows: flattenRegexTree(r.tree).length };
})));
"""


@pytest.fixture(scope="module")
def explained():
    node = shutil.which("node")
    if not node:
        pytest.skip("node not installed")
    proc = subprocess.run([node, "-e", RUNNER, str(APP_JS)], input=json.dumps(PATTERNS),
                          capture_output=True, text=True, timeout=60)
    assert proc.returncode == 0, proc.stderr
    return dict(zip(PATTERNS, json.loads(proc.stdout)))


@pytest.mark.parametrize("pattern", PATTERNS)
def test_explainer_agrees_with_python(explained, pattern):
    result = explained[pattern]
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        try:
            groups, python_error = re.compile(pattern).groups, None
        except re.error as exc:
            groups, python_error = None, str(exc)
    if python_error:
        assert result["errors"], f"Python rejects it ({python_error}) but the explanation reports no problem"
    else:
        assert not result["errors"], f"Python accepts it but the explanation reports {result['errors']}"
        assert result["groups"] == groups
        assert result["rows"] > 0
