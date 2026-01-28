#!/usr/bin/env node
/**
 * TKFM_SITE_MODE Dist Filter
 * - mode=radio   => keep radio/creator/dj/promo pages, remove records-only pages
 * - mode=records => keep records/label/distribution/mixtapes/royalty pages, remove radio-only pages
 *
 * This script ONLY touches dist/*.html (root). It does not delete assets.
 * Run AFTER your normal dist build script creates dist + copies static files.
 */
import fs from "fs";
import path from "path";

const mode = (process.env.TKFM_SITE_MODE || "radio").toLowerCase().trim();
const distDir = path.resolve(process.cwd(), "dist");

function exists(p) {
  try { fs.accessSync(p); return true; } catch { return false; }
}

function listRootHtml(dir) {
  if (!exists(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.toLowerCase().endsWith(".html"))
    .map(f => ({ name: f, full: path.join(dir, f) }));
}

function keepByRegex(name, allow) {
  for (const rx of allow) if (rx.test(name)) return true;
  return false;
}

function rmFile(p) {
  try { fs.unlinkSync(p); return true; } catch { return false; }
}

// --- Allowlists ---
// If a file isn't matched here, it gets deleted for that mode.
const COMMON = [
  /^index\.html$/i,
  /^404\.html$/i,
  /^cancel\.html$/i,
  /^success\.html$/i,
  /^login\.html$/i,
  /^register\.html$/i,
  /^dashboard\.html$/i,
  /^account\.html$/i,
  /^client-vault\.html$/i,
  /^support\.html$/i,
  /^contact\.html$/i,
  /^terms\.html$/i,
  /^privacy\.html$/i,
  /^tkfm-sitemap\.html$/i,
  /^post-checkout\.html$/i,
  /^entitlements\.html$/i,
  /^unlocks\.html$/i,
  /^start-here\.html$/i,
];

const RADIO_ALLOW = [
  ...COMMON,

  // Radio core
  /^radio-.*\.html$/i,
  /^live\.html$/i,
  /^now-playing\.html$/i,
  /^sponsor-.*\.html$/i,
  /^sponsors\.html$/i,
  /^ai-drops.*\.html$/i,
  /^ai-dj-.*\.html$/i,
  /^creator-.*\.html$/i,
  /^dj-.*\.html$/i,
  /^submit\.html$/i,
  /^pricing\.html$/i,
  /^feature-.*\.html$/i,
  /^social-.*\.html$/i,
  /^press-.*\.html$/i,
  /^media-.*\.html$/i,
  /^news\.html$/i,
  /^artists\.html$/i,
  /^djs\.html$/i,
  /^schedule\.html$/i,
  /^app-hub\.html$/i,
  /^engines\.html$/i,

  // Podcast lane (radio-side)
  /^podcast.*\.html$/i,
  /^podcaster-.*\.html$/i,

  // Catalog (radio-facing)
  /^tkfm-catalog\.html$/i,

  // Owner consoles (radio-side)
  /^owner-live-.*\.html$/i,
  /^owner-tv-.*\.html$/i,
  /^owner-sponsor-.*\.html$/i,
  /^owner-schedule-.*\.html$/i,
  /^owner-featured-.*\.html$/i,
  /^owner-boost-.*\.html$/i,
  /^owner-dashboard\.html$/i,
  /^owner-ops-dashboard\.html$/i,
  /^owner-view-analytics\.html$/i,
  /^god-view\.html$/i,
  /^tkfm-dev-console\.html$/i,
];

const RECORDS_ALLOW = [
  ...COMMON,

  // Records / Label core
  /^label-.*\.html$/i,
  /^label\.html$/i,
  /^records-.*\.html$/i,

  // Distribution + ops
  /^distribution.*\.html$/i,
  /^owner-distribution-.*\.html$/i,

  // Label studio + ops tools
  /^label-studio-.*\.html$/i,
  /^owner-label-studio-.*\.html$/i,
  /^owner-mix-lab-.*\.html$/i,
  /^owner-deliver-request\.html$/i,

  // Mixtapes store + ops
  /^they-krave-for-me-mixtapes\.html$/i,
  /^mixtape-.*\.html$/i,
  /^mixtapes-.*\.html$/i,
  /^my-mixtapes\.html$/i,
  /^owner-mixtape-.*\.html$/i,

  // Secure money / royalties
  /^owner-royalty-.*\.html$/i,
  /^royalty-.*\.html$/i,
  /^creator-statement\.html$/i,

  // Generic owner portals that are safe for records ops
  /^owner-dashboard\.html$/i,
  /^owner-ops-dashboard\.html$/i,
  /^owner-view-analytics\.html$/i,
];

function main() {
  if (!exists(distDir)) {
    console.log(`[tkfm-site-mode] Dist not found: ${distDir}`);
    process.exit(0);
  }

  const allow = mode === "records" ? RECORDS_ALLOW : RADIO_ALLOW;
  const htmlFiles = listRootHtml(distDir);

  let kept = 0, removed = 0;

  for (const f of htmlFiles) {
    const ok = keepByRegex(f.name, allow);
    if (ok) kept++;
    else {
      if (rmFile(f.full)) removed++;
    }
  }

  console.log(`[tkfm-site-mode] Mode=${mode}. Kept ${kept} HTML files, removed ${removed}. Dist=${path.basename(distDir)}`);

  if (mode === "records") {
    const labelHome = path.join(distDir, "label-home.html");
    const indexFile = path.join(distDir, "index.html");
    if (exists(labelHome)) {
      fs.copyFileSync(labelHome, indexFile);
      console.log(`[tkfm-site-mode] records: set homepage => copied label-home.html to index.html`);
    } else {
      console.log(`[tkfm-site-mode][WARN] records: label-home.html not found in dist. Homepage not set.`);
    }

    // HARD GUARANTEE: delete common radio consoles if they slipped through (belt + suspenders)
    const hardBlock = [
      /^owner-live-.*\.html$/i,
      /^radio-.*\.html$/i,
      /^now-playing\.html$/i,
      /^live\.html$/i,
      /^podcast.*\.html$/i,
      /^podcaster-.*\.html$/i,
      /^sponsor-.*\.html$/i,
      /^ai-drops.*\.html$/i,
      /^ai-dj-.*\.html$/i,
      /^app-hub\.html$/i,
      /^engines\.html$/i,
      /^tkfm-catalog\.html$/i,
    ];
    const after = listRootHtml(distDir);
    let nuked = 0;
    for (const f of after) {
      if (hardBlock.some(rx => rx.test(f.name))) {
        if (rmFile(f.full)) nuked++;
      }
    }
    if (nuked) console.log(`[tkfm-site-mode] records: hard-block removed ${nuked} radio HTML files`);
  }

  if (mode === "radio") {
    // Ensure records landing doesn't show up on radio
    const hardBlock = [
      /^label-.*\.html$/i,
      /^label\.html$/i,
      /^records-.*\.html$/i,
      /^distribution.*\.html$/i,
      /^royalty-.*\.html$/i,
      /^owner-distribution-.*\.html$/i,
      /^owner-royalty-.*\.html$/i,
      /^label-studio-.*\.html$/i,
      /^owner-label-studio-.*\.html$/i,
    ];
    const after = listRootHtml(distDir);
    let nuked = 0;
    for (const f of after) {
      if (hardBlock.some(rx => rx.test(f.name))) {
        if (rmFile(f.full)) nuked++;
      }
    }
    if (nuked) console.log(`[tkfm-site-mode] radio: hard-block removed ${nuked} records HTML files`);
  }
}

main();
