#!/usr/bin/env bash
set -euo pipefail

python -m venv .venv
if command -v uv >/dev/null 2>&1; then
  .venv/bin/python -m pip install -U pip
  uv pip install -e .[dev]
else
  .venv/bin/python -m pip install -U pip
  .venv/bin/pip install -e .[dev]
fi
echo "Done. Activate with: source .venv/bin/activate"

