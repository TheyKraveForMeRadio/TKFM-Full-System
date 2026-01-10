TKFM NEXT POWER MOVE — FIX PROD 404 LINKS + 4KB FUNCTION ENV LIMIT

What this patch does:
1) Switches Netlify build to a STATIC multipage build (no Vite bundling).
   - Copies ALL root *.html into dist
   - Copies js/ and public/ into dist
   - Generates dist/_redirects so /pricing works as /pricing.html

2) Adds a SAFE prune script that unsets STRIPE_PRICE_* and STRIPE_PRODUCT_* ONLY in:
   context=production scope=functions
   This drops Lambda env size under 4KB so functions stop deploying as 404.

Run:
  bash ./scripts/tkfm-fix-prod-deploy-now.sh
