#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "== TKFM DEPLOY-PREVIEW SMOKE =="
echo "Project: $ROOT"

# Always run build + audits first
bash scripts/tkfm-build-smoke.sh

echo
if [ "${TKFM_DEPLOY_PREVIEW:-}" != "YES" ]; then
  echo "ℹ️  Deploy preview is DISABLED."
  echo "   To enable: TKFM_DEPLOY_PREVIEW=YES bash scripts/tkfm-deploy-preview-smoke.sh"
  exit 0
fi

# Deploy preview ONLY when explicitly enabled
if ! command -v netlify >/dev/null 2>&1; then
  echo "❌ netlify CLI not found. Install: npm i -g netlify-cli"
  exit 1
fi

echo
echo ">> Netlify deploy (draft / preview)"
netlify deploy --dir dist --message "TKFM preview smoke" || {
  echo "❌ netlify deploy failed"
  exit 1
}

echo
echo "✅ DEPLOY-PREVIEW SMOKE: PASS"
