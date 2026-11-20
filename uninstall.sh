#!/usr/bin/env sh
set -eu
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
if command -v python3 >/dev/null 2>&1; then
  python3 "$SCRIPT_DIR/manage.py" uninstall
elif command -v python >/dev/null 2>&1; then
  python "$SCRIPT_DIR/manage.py" uninstall
else
  echo "Error: Python 3 is required." >&2
  exit 1
fi
