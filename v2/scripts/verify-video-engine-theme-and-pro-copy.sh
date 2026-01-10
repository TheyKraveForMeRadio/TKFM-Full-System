#!/usr/bin/env bash
set -euo pipefail
F="video-engine.html"
if [ ! -f "$F" ]; then echo "Missing $F"; exit 1; fi

echo "== TKFM: Verify video-engine theme + pro copy =="
grep -q 'id="tkfmVideoEngineTheme"' "$F" && echo "OK theme css" || (echo "FAIL theme css"; exit 1)
grep -q 'TKFM_VIDEO_ENGINE_PRO_COPY_START' "$F" && echo "OK pro copy" || (echo "FAIL pro copy"; exit 1)
