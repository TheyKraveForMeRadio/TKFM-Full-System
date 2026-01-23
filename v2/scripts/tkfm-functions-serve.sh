\
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FIRST_PORT="${1:-9999}"

echo "== TKFM FUNCTIONS =="

# Ensure curl exists
command -v curl >/dev/null 2>&1 || { echo "❌ curl is required"; exit 1; }

# Keep a small port list starting at FIRST_PORT
PORTS=()
# Put FIRST_PORT first, then the rest descending 9999..9990 without duplicates
PORTS+=("$FIRST_PORT")
for p in 9999 9998 9997 9996 9995 9994 9993 9992 9991 9990; do
  if [[ "$p" != "$FIRST_PORT" ]]; then PORTS+=("$p"); fi
done

start_and_probe() {
  local p="$1"
  local pid

  # Try starting functions server (latest CLI to avoid old flag issues)
  # Note: some Netlify CLI builds "reserve" a port; if it errors quickly we'll move on.
  (npx -y netlify-cli@latest functions:serve --port "$p" --functions netlify/functions) &
  pid=$!

  # Probe for readiness
  for _ in {1..20}; do
    if curl -sS --max-time 0.6 "http://localhost:${p}/.netlify/functions/debug-stripe-env" >/dev/null 2>&1; then
      echo "$p" > .tkfm-functions-port
      echo "[FNS] ✅ Ready on :$p (pid $pid)"
      wait "$pid"
      return 0
    fi
    # If process already exited, stop waiting
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      return 1
    fi
    sleep 0.25
  done

  # Timed out waiting; stop process
  kill "$pid" >/dev/null 2>&1 || true
  return 1
}

rm -f .tkfm-functions-port 2>/dev/null || true

for p in "${PORTS[@]}"; do
  echo "[FNS] Trying :$p"
  if start_and_probe "$p"; then
    exit 0
  fi
done

echo "[FNS] ❌ Could not start functions server on any port (9999..9990)."
echo "[FNS] Fix: update Node/Netlify CLI or free the ports."
exit 1
