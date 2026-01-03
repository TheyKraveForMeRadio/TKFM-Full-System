#!/usr/bin/env bash
set -euo pipefail

FILE="netlify/functions/create-checkout-session.js"
if [ ! -f "$FILE" ]; then
  echo "Missing $FILE . Skipping."
  exit 0
fi

mkdir -p backups
stamp="$(date +%Y%m%d_%H%M%S)"
cp -f "$FILE" "backups/create-checkout-session.js.bak_${stamp}"

# Robust planId extraction injection
perl -0777 -i -pe '
  my $did = 0;

  # Replace a destructured parse if present
  if (s/const\s*\{\s*planId\s*\}\s*=\s*JSON\.parse\(\s*event\.body\s*\|\|\s*["\x27]\{\}["\x27]\s*\)\s*;/
const __body = (() => { try { return JSON.parse(event.body || "{}"); } catch (e) { return {}; } })();
    const __qs = (event.queryStringParameters || {});
    const planId = (__body.planId || __body.plan || __body.feature || __body.id || __body.lookup_key || __body.lookupKey || __qs.planId || __qs.plan || __qs.feature || __qs.id || __qs.lookup_key || __qs.lookupKey || "").toString().trim();
    if (!planId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing planId", hint: "Add data-plan or data-feature to the button. Accepted fields: planId, plan, feature, id." }) };
    }/s) { $did = 1; }

  if (!$did && s/const\s*\{\s*planId\s*\}\s*=\s*JSON\.parse\(\s*event\.body\s*\)\s*;/
const __body = (() => { try { return JSON.parse(event.body || "{}"); } catch (e) { return {}; } })();
    const __qs = (event.queryStringParameters || {});
    const planId = (__body.planId || __body.plan || __body.feature || __body.id || __body.lookup_key || __body.lookupKey || __qs.planId || __qs.plan || __qs.feature || __qs.id || __qs.lookup_key || __qs.lookupKey || "").toString().trim();
    if (!planId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing planId", hint: "Add data-plan or data-feature to the button. Accepted fields: planId, plan, feature, id." }) };
    }/s) { $did = 1; }

  if (!$did) {
    s/(export\s+async\s+function\s+handler\s*\(\s*event\s*\)\s*\{)/$1
    const __body = (() => { try { return JSON.parse(event.body || "{}"); } catch (e) { return {}; } })();
    const __qs = (event.queryStringParameters || {});
    const planId = (__body.planId || __body.plan || __body.feature || __body.id || __body.lookup_key || __body.lookupKey || __qs.planId || __qs.plan || __qs.feature || __qs.id || __qs.lookup_key || __qs.lookupKey || "").toString().trim();
    if (!planId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing planId", hint: "Add data-plan or data-feature to the button. Accepted fields: planId, plan, feature, id." }) };
    }/s;
  }
' "$FILE"

echo "Patched $FILE (fallback planId). Backup: backups/create-checkout-session.js.bak_${stamp}"
