#!/usr/bin/env bash
set -euo pipefail
# Usage: ./scripts/tkfm-wait-port.sh 8888 40
PORT="${1:-8888}"
SECS="${2:-40}"
URL="http://localhost:${PORT}/"

for i in $(seq 1 "$SECS"); do
  if curl -sS "$URL" >/dev/null 2>&1; then
    echo "OK: port ${PORT} responding"
    exit 0
  fi
  sleep 1
done

echo "FAIL: port ${PORT} not responding after ${SECS}s"
exit 2
