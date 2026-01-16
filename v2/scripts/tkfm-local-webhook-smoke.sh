#!/usr/bin/env bash
set -euo pipefail
echo "Local webhook sanity checks (functions serve must be running on :9999)"
echo

echo "GET sponsor:"
curl -sS http://localhost:9999/.netlify/functions/stripe-webhook-sponsor | tr -d '\r'
echo
echo

echo "GET drops:"
curl -sS http://localhost:9999/.netlify/functions/stripe-webhook-drops | tr -d '\r'
echo
