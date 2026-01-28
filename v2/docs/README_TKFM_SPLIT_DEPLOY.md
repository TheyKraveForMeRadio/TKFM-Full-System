# TKFM Split Deploy (One Repo, Two Sites)

You are running:
- tkfmradio.com  (RADIO site)
- TKFM Records (separate Netlify site / netlify.app URL for now)

This patch adds a **safe** build-time filter:
- Set env: `TKFM_SITE_MODE=radio` or `TKFM_SITE_MODE=records`
- After your normal build produces `dist/`, run:
  `node scripts/tkfm-site-mode-filter.mjs`

The script removes HTML pages that do not belong to that site.

## Netlify Build Command (RADIO site)
Use your existing build command, then append the filter:

    <YOUR EXISTING BUILD COMMAND> && node scripts/tkfm-site-mode-filter.mjs

Set env:
- `TKFM_SITE_MODE=radio`

## Netlify Build Command (RECORDS site)
Same build command (same repo), append the filter.

Set env:
- `TKFM_SITE_MODE=records`

The script will:
- Remove radio pages
- Copy `label-home.html` to `index.html` so Records has a clean homepage

## Local test
Build your dist the normal way, then:

    TKFM_SITE_MODE=radio node scripts/tkfm-site-mode-filter.mjs
    TKFM_SITE_MODE=records node scripts/tkfm-site-mode-filter.mjs

(Windows note: you can set env in Git Bash like `export TKFM_SITE_MODE=radio` then run node.)

## Safety
If `TKFM_SITE_MODE` is not set, script does **nothing**.
