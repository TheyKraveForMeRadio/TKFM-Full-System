#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Verify video-engine.html not blank + CSS blocks sane =="
F="video-engine.html"
[ -f "$F" ] || { echo "ERROR: $F not found"; exit 1; }

LINES="$(wc -l < "$F" | tr -d ' ')"
BODY="$(grep -c "<body" "$F" || true)"
END="$(grep -c "</html>" "$F" || true)"
CONTENT="$(grep -qiE "Monthly|Visuals|Video|Reels|Campaign|Submit|Lane" "$F" && echo 1 || echo 0)"
STYLE_OPEN="$(grep -ci "<style" "$F" || true)"
STYLE_CLOSE="$(grep -ci "</style>" "$F" || true)"
HAS_MODAL="$(grep -qi "tkfmPaidLaneModalHost" "$F" && echo 1 || echo 0)"
HAS_SCRIPT="$(grep -qi "tkfm-paid-lane-submit\\.js" "$F" && echo 1 || echo 0)"

echo "lines=$LINES body=$BODY end=$END content=$CONTENT style_open=$STYLE_OPEN style_close=$STYLE_CLOSE modalHost=$HAS_MODAL script=$HAS_SCRIPT"

if [ "$BODY" -eq 0 ] || [ "$END" -eq 0 ] || [ "$CONTENT" -eq 0 ]; then
  echo "FAIL: page looks blank or truncated."
  exit 1
fi

if [ "$STYLE_OPEN" -ne "$STYLE_CLOSE" ]; then
  echo "FAIL: style tags unbalanced (open=$STYLE_OPEN close=$STYLE_CLOSE)"
  exit 1
fi

echo "OK"
