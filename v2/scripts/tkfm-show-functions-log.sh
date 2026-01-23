#!/usr/bin/env bash
set -euo pipefail
LOG_FILE=".tkfm/functions.log"
if [ ! -f "$LOG_FILE" ]; then
  echo "No log found at $LOG_FILE"
  exit 1
fi
sed -n '1,200p' "$LOG_FILE"
