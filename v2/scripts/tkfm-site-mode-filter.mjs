#!/usr/bin/env node
/**
 * TKFM Site Mode Filter (RADIO vs RECORDS)
 *
 * Purpose:
 * - You are running TWO Netlify sites from ONE repo.
 * - Each deploy sets env: TKFM_SITE_MODE=radio OR TKFM_SITE_MODE=records
 * - After your normal dist build runs, this script removes HTML pages that don't belong.
 *
 * Safe default:
 * - If TKFM_SITE_MODE is missing/unknown => no filtering (mode "all").
 *
 * Usage (Netlify build command):
 *   <YOUR EXISTING BUILD COMMAND> && node scripts/tkfm-site-mode-filter.mjs
 *
 * Optional env:
 *   TKFM_DIST_DIR=dist
 */

import fs from "fs";
import path from "path";

const modeRaw = (process.env.TKFM_SITE_MODE || "all").toLowerCase().trim();
const mode = (modeRaw === "radio" || modeRaw === "records") ? modeRaw : "all";
const distDir = process.env.TKFM_DIST_DIR ? process.env.TKFM_DIST_DIR : "dist";

const DIST = path.resolve(process.cwd(), distDir);

function log(...a){ console.log("[tkfm-site-mode]", ...a); }
function warn(...a){ console.warn("[tkfm-site-mode][WARN]", ...a); }

if (!fs.existsSync(DIST) || !fs.statSync(DIST).isDirectory()) {
  warn(`Dist folder not found: ${DIST}`);
  warn(`Nothing to filter. (Did your build produce "${distDir}"?)`);
  process.exit(0);
}

if (mode === "all") {
  log(`TKFM_SITE_MODE="${modeRaw}" => mode=all (no filtering).`);
  process.exit(0);
}

// Always keep these on BOTH sites (shared auth + legal + portal).
const KEEP_SHARED = [
  /^404\.html$/i,
  /^index\.html$/i, // will be removed on records below if desired
  /^login\.html$/i,
  /^register\.html$/i,
  /^account\.html$/i,
  /^dashboard\.html$/i,
  /^client-vault\.html$/i,
  /^support\.html$/i,
  /^contact\.html$/i,
  /^terms\.html$/i,
  /^privacy\.html$/i,
  /^tkfm-sitemap\.html$/i,
  /^success\.html$/i,
  /^cancel\.html$/i,
];

// RADIO site pages
const KEEP_RADIO = [
  /^index\.html$/i,
  /^radio-.*\.html$/i,
  /^live\.html$/i,
  /^now-playing\.html$/i,
  /^station-chat\.html$/i,
  /^submit\.html$/i,
  /^pricing\.html$/i,
  /^app-hub\.html$/i,
  /^engines\.html$/i,
  /^ai-drops.*\.html$/i,
  /^sponsor-.*\.html$/i,
  /^podcast-.*\.html$/i,
  /^podcaster-.*\.html$/i,
  /^creator-.*\.html$/i,
  /^dj-.*\.html$/i,
  /^feature-.*\.html$/i,
  /^social-.*\.html$/i,
  /^tkfm-catalog\.html$/i,
  /^tkfm-dev-console\.html$/i,
  /^tv-.*\.html$/i,
  /^radio-tv.*\.html$/i,
  /^donate\.html$/i,
  /^unlocks\.html$/i,
];

// RECORDS site pages
const KEEP_RECORDS = [
  // no index.html on records by default (records should have label-home as homepage)
  /^label-.*\.html$/i,
  /^records-.*\.html$/i,
  /^distribution.*\.html$/i,
  /^owner-.*\.html$/i,
  /^royalty-.*\.html$/i,
  /^payout.*\.html$/i,
  /^statement.*\.html$/i,
  /^mixtape-.*\.html$/i,
  /^they-krave-for-me-mixtapes\.html$/i,
  /^my-mixtapes\.html$/i,
  /^mixtape-product\.html$/i,
  /^mixtapes-success\.html$/i,
  /^label-studio-.*\.html$/i,
  /^label-contract-.*\.html$/i,
  /^label-onboarding\.html$/i,
  /^label-home\.html$/i,
];

function shouldKeep(filename) {
  // records site: do NOT keep index.html by default
  if (mode === "records" && /^index\.html$/i.test(filename)) return false;

  const pools = [KEEP_SHARED, mode === "radio" ? KEEP_RADIO : KEEP_RECORDS];
  return pools.some(list => list.some(rx => rx.test(filename)));
}

const entries = fs.readdirSync(DIST, { withFileTypes: true });

// Only filter top-level HTML files. (Assets in /assets etc stay untouched.)
const htmlFiles = entries
  .filter(d => d.isFile())
  .map(d => d.name)
  .filter(n => n.toLowerCase().endsWith(".html"));

let kept = 0, removed = 0;

for (const f of htmlFiles) {
  if (shouldKeep(f)) { kept++; continue; }
  try {
    fs.unlinkSync(path.join(DIST, f));
    removed++;
  } catch (e) {
    warn(`Failed to remove ${f}: ${String(e && e.message ? e.message : e)}`);
  }
}

log(`Mode=${mode}. Kept ${kept} HTML files, removed ${removed}. Dist=${distDir}`);

if (mode === "records") {
  // Optional: promote label-home.html to be the records homepage by copying it to index.html
  const labelHome = path.join(DIST, "label-home.html");
  const indexPath = path.join(DIST, "index.html");
  if (fs.existsSync(labelHome)) {
    try {
      fs.copyFileSync(labelHome, indexPath);
      log(`records: set homepage => copied label-home.html to index.html`);
    } catch (e) {
      warn(`records: failed to copy label-home.html to index.html: ${String(e && e.message ? e.message : e)}`);
    }
  } else {
    warn(`records: label-home.html not found in dist. Homepage not set.`);
  }
}
