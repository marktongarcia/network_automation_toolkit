"""
Every example in the Regex quick reference (REGEX_REFERENCE in static/app.js) must work in Python:
the example pattern must match the sample text, or for substitution rows the replacement must
produce the expected text.
"""
import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

APP_JS = Path(__file__).resolve().parent.parent / "static" / "app.js"

RUNNER = r"""
const fs = require('fs');
const src = fs.readFileSync(process.argv[1], 'utf8');
const m = src.match(/^const REGEX_REFERENCE = (\[[\s\S]*?\n\]);/m);
process.stdout.write(JSON.stringify(eval(m[1])));
"""


def load_rows():
    node = shutil.which("node")
    if not node:
        return []
    proc = subprocess.run([node, "-e", RUNNER, str(APP_JS)], capture_output=True, text=True, timeout=60)
    assert proc.returncode == 0, proc.stderr
    return [row for row in json.loads(proc.stdout) if "tokens" in row]


ROWS = load_rows()


@pytest.mark.skipif(not ROWS, reason="node not installed")
def test_reference_has_rows():
    assert len(ROWS) > 40


@pytest.mark.parametrize("row", ROWS, ids=[f"{r['tokens'][0]} {r['example']}" for r in ROWS])
def test_reference_example_works_in_python(row):
    test = row["test"]
    if "pattern" in test:  # substitution row: the example is the replacement
        assert re.sub(test["pattern"], row["example"], test["text"]) == test["expect"]
    else:
        match = re.search(row["example"], test["text"])
        assert match, f"{row['example']!r} does not match {test['text']!r}"
        assert match.group(0) == test["expect"]
