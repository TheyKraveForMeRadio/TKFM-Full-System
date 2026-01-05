TKFM FIX — NETLIFY CLI: Missing required path variable 'account_id'

Use:
./scripts/tkfm-netlify-env-set.sh KEY VALUE

It will:
- read .netlify/state.json siteId
- call netlify env:set with --site to avoid account_id errors
- fall back to plain env:set if needed
