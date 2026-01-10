TKFM FIX — Netlify env audit/prune scripts failing with Node SyntaxError

Root cause:
- old scripts accidentally fed JSON into node as CODE (due to heredoc + <<< usage)

Fix:
- pipe netlify env:list --json into node stdin

Run:
  chmod +x scripts/tkfm-netlify-env-audit-size.sh scripts/tkfm-netlify-prune-stripe-env.sh
  ./scripts/tkfm-netlify-env-audit-size.sh
  ./scripts/tkfm-netlify-prune-stripe-env.sh
  ./scripts/tkfm-netlify-env-audit-size.sh
  netlify deploy --prod
