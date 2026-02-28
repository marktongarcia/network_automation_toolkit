# Contributing

Thanks for contributing to Network Automation Toolkit.

## Development Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
./app.py
```

App URL: `http://127.0.0.1:5000`

## Contribution Guidelines

- Keep changes focused and small.
- Prefer practical UX improvements with clear examples.
- Preserve existing tool behavior unless the change is intentional.
- Update `README.md` when adding or changing features.
- Keep code readable; add comments only where needed.

## Reporting Bugs

Please include:

- What you expected
- What happened instead
- Steps to reproduce
- Sample input data (sanitized)
- Screenshot or terminal output if relevant

## Pull Requests

Before opening a PR:

1. Verify the app starts locally.
2. Test the affected tool tabs manually.
3. Ensure no unrelated file changes are included.
4. Describe user-visible changes clearly.

## Security

Python Playground executes code locally. Do not run untrusted input.

If you find a security issue, avoid public disclosure in issues. Share details privately with the maintainer first.
