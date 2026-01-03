#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "== Find any hard-coded Stripe price_ IDs inside HTML/JS =="
grep -RIn "price_[A-Za-z0-9]+" *.html js netlify/functions 2>/dev/null || echo "No price_ ids found."
