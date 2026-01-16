#!/usr/bin/env bash
set -euo pipefail

echo "TKFM: Free port 9999 on Windows (Git Bash safe)"
PID=$(netstat -ano | findstr :9999 | awk '{print $5}' | head -n 1 || true)
if [ -z "${PID:-}" ]; then
  echo "No PID found listening on 9999."
  exit 0
fi
echo "Killing PID: $PID"
taskkill //PID "$PID" //F || true
echo "Done."
