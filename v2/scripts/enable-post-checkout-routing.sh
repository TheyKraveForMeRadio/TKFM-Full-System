#!/usr/bin/env bash
set -euo pipefail

echo "== TKFM: Enable Post-Checkout Routing (paid lane enforcement) =="
echo

ROOT="$(pwd)"
STAMP="$(date +%Y%m%d_%H%M%S)"
BK="backups/post-checkout-routing-$STAMP"
mkdir -p "$BK"

TARGET="netlify/functions/create-checkout-session.js"
if [ ! -f "$TARGET" ]; then
  echo "WARN: $TARGET not found (skipping success_url patch)."
  echo "NOTE: post-checkout.html + JS are installed, but your create-checkout-session must redirect to /post-checkout.html for full routing."
  exit 0
fi

cp -p "$TARGET" "$BK/create-checkout-session.js.bak"

# Try to move success_url and cancel_url to /post-checkout.html and /pricing.html
# This is intentionally conservative: we only change if we see "/checkout-success" or "checkout-success.html" already used.
perl -0777 -pe '
  s/(success_url\s*:\s*`[^`]*)(\/checkout-success(?:\.html)?)([^`]*`)/$1\/post-checkout.html$3/g;
  s/(cancel_url\s*:\s*`[^`]*)(\/pricing\.html[^`]*`)/$1\/pricing.html$3/g;
' -i "$TARGET"

# Ensure planId is included in success_url query when success_url is a template string
# Add "?planId=${encodeURIComponent(planId)}&session_id=..." if missing.
node <<'NODE'
import fs from "fs";

const file = "netlify/functions/create-checkout-session.js";
let s = fs.readFileSync(file, "utf8");

function patchSuccessUrl(str) {
  // find success_url: `...`
  const re = /success_url\s*:\s*`([^`]*)`/m;
  const m = s.match(re);
  if (!m) return;

  const inside = m[1];

  // Already has planId=
  if (inside.includes("planId=")) return;

  // Add planId in front of session_id if present; else append planId at end.
  let next = inside;

  if (inside.includes("session_id=") || inside.includes("{CHECKOUT_SESSION_ID}")) {
    // Insert planId before existing query bits.
    if (inside.includes("?")) {
      next = inside.replace("?", `?planId=${'${encodeURIComponent(planId)}'}&`);
    } else {
      next = inside + `?planId=${'${encodeURIComponent(planId)}'}`;
    }
  } else {
    // No session id param visible, still add planId.
    if (inside.includes("?")) next = inside + `&planId=${'${encodeURIComponent(planId)}'}`;
    else next = inside + `?planId=${'${encodeURIComponent(planId)}'}`;
  }

  s = s.replace(re, `success_url: \`${next}\``);
}

patchSuccessUrl(s);

fs.writeFileSync(file, s, "utf8");
console.log("OK: Patched success_url to include planId (if needed).");
NODE

echo
echo "DONE."
echo "Backup: $BK"
echo "Next: run netlify dev and complete a test checkout; you should land on /post-checkout.html with auto routes."
