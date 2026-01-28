# TKFM Split Deploy (RADIO vs RECORDS) — V2

This repo can deploy as **two separate sites** from the same codebase.

- **RADIO site** (tkfmradio.com): radio-only experience (stream, now playing, radio hub, AI drops/tags, sponsor reads, podcasts, DJ tools, promo engines)
- **RECORDS site** (temporary netlify.app until you buy domain): label-only experience (TKFM Records, Label Studio, Distribution, Mixtapes store, Secure Money / royalties)

## Core switch
Set this environment variable per Netlify site:

- `TKFM_SITE_MODE=radio`
- `TKFM_SITE_MODE=records`

## Build command
Append the filter AFTER your normal dist build.

Example:

```bash
bash scripts/tkfm-build-static-multipage.sh && node scripts/tkfm-site-mode-filter.mjs
```

## What it does
- Only deletes `dist/*.html` root files that don't belong to the selected mode.
- Does **not** delete assets (js/css/images).
- In `records` mode: sets the homepage by copying `dist/label-home.html` to `dist/index.html`.

## Local test
```bash
bash scripts/tkfm-build-static-multipage.sh
export TKFM_SITE_MODE=records
node scripts/tkfm-site-mode-filter.mjs
```

Then:
- records dist should NOT contain radio pages (radio-hub, live, now-playing, owner-live-console, podcasts, sponsor, AI drops)
- radio dist should NOT contain label/distribution/royalty pages
