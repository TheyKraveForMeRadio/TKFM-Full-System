TKFM FIX — ALL LINKS 404 ON NETLIFY (MULTI-PAGE DIST PACK)

PROBLEM:
- Netlify publishes /dist
- Vite builds only index.html by default
- Your other *.html pages + /js scripts weren't in /dist => Netlify returns 404 for every link

FIX:
- Add a postbuild pack step that:
  1) Copies all root *.html into dist/
  2) Copies js/ into dist/js/
  3) Copies public/ assets into dist/
  4) Generates dist/_redirects so /page maps to /page.html

WHAT CHANGED:
- netlify.toml build command now runs:
  bash ./scripts/tkfm-prebuild-clean.sh && npm run build && bash ./scripts/tkfm-postbuild-pack.sh
- scripts/tkfm-postbuild-pack.sh added

AFTER APPLY:
- netlify deploy --prod
- test:
  curl -I https://tkfmradio.com/pricing.html
  curl -I https://tkfmradio.com/pricing
