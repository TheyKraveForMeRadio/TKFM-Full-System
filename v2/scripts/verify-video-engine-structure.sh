#!/usr/bin/env bash
set -euo pipefail
F="video-engine.html"
[ -f "$F" ] || { echo "FAIL: $F not found"; exit 1; }

echo "== TKFM: Verify video-engine.html structure + style balance =="
opens=$(grep -i "<style" "$F" | wc -l | tr -d " ")
closes=$(grep -i "</style>" "$F" | wc -l | tr -d " ")
headLine=$(grep -in "<head" "$F" | head -n1 | cut -d: -f1 || true)
headClose=$(grep -in "</head>" "$F" | head -n1 | cut -d: -f1 || true)
bodyLine=$(grep -in "<body" "$F" | head -n1 | cut -d: -f1 || true)
bodyClose=$(grep -in "</body>" "$F" | head -n1 | cut -d: -f1 || true)

echo "style_open=$opens style_close=$closes"
echo "head_open_line=$headLine head_close_line=$headClose body_open_line=$bodyLine body_close_line=$bodyClose"

[ "$opens" = "$closes" ] || { echo "FAIL: style tags unbalanced"; exit 1; }
[ -n "$headLine" ] && [ -n "$headClose" ] && [ "$headClose" -gt "$headLine" ] || { echo "FAIL: head missing/bad"; exit 1; }
[ -n "$bodyLine" ] && [ -n "$bodyClose" ] && [ "$bodyClose" -gt "$bodyLine" ] || { echo "FAIL: body missing/bad"; exit 1; }
[ "$bodyLine" -gt "$headClose" ] || { echo "FAIL: body starts before head closes"; exit 1; }

echo
echo "Top of file (sanity):"
nl -ba "$F" | sed -n '1,30p'
echo
echo "OK"
