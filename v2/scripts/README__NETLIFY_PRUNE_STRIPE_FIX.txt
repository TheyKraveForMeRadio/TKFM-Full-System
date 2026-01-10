TKFM FIX — prune script couldn't list keys

Reason:
- netlify-cli output differs per version; must use --plain with scope/context fallback.

Run:
  chmod +x scripts/tkfm-netlify-prune-stripe-env.sh
  ./scripts/tkfm-netlify-prune-stripe-env.sh
  ./scripts/tkfm-netlify-env-audit-size.sh
  netlify deploy --prod
