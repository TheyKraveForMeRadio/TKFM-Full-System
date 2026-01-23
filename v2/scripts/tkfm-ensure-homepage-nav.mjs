import fs from "fs";

const file = "index.html";
if (!fs.existsSync(file)) {
  console.error("ERROR: index.html not found in project root.");
  process.exit(1);
}

let html = fs.readFileSync(file, "utf8");

const MARK = "<!-- TKFM_QUICKLINKS_V2 -->";
if (html.includes(MARK)) {
  console.log("OK: Homepage Quick Links already present (TKFM_QUICKLINKS_V2).");
  process.exit(0);
}

const block = `
${MARK}
<section style="max-width:1120px;margin:26px auto 18px auto;padding:18px;border-radius:18px;background:rgba(2,6,23,.78);border:1px solid rgba(168,85,247,.32);box-shadow:0 0 0 1px rgba(34,211,238,.10),0 12px 40px rgba(0,0,0,.45);">
  <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:14px;flex-wrap:wrap;">
    <div>
      <div style="font-weight:900;letter-spacing:.6px;font-size:18px;color:#e2e8f0;">TKFM — Start Here</div>
      <div style="margin-top:6px;color:#94a3b8;font-size:13px;line-height:1.45;">
        The Independent Artist Power Station — choose a lane, submit, or shop. Full navigation lives in the sitemap.
      </div>
    </div>
    <a href="/tkfm-sitemap.html" style="text-decoration:none;padding:10px 14px;border-radius:999px;font-weight:900;color:#020617;background:linear-gradient(90deg,#22d3ee,#a855f7,#ec4899);box-shadow:0 10px 25px rgba(0,0,0,.35);">
      All Pages (Sitemap)
    </a>
  </div>

  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:14px;">
    ${card("/radio-hub.html","Radio Hub","Main listener + creator gateway","rgba(34,211,238,.22)")}
    ${card("/pricing.html","Pricing","Memberships + top-ups","rgba(168,85,247,.22)")}
    ${card("/ai-drops-engine.html","AI Drops / Tags","DJ tags • station IDs • imaging","rgba(236,72,153,.22)")}
    ${card("/sponsor-read.html","Sponsor Reads","Credits + request pipeline","rgba(34,211,238,.22)")}
    ${card("/label-studio-hub.html","TKFM Records Studio","Credits • deliverables • pro mix lane","rgba(250,204,21,.24)")}
    ${card("/they-krave-for-me-mixtapes.html","Mixtapes Store","DJ / No‑DJ versions • tracklists","rgba(250,204,21,.24)")}
    ${card("/my-mixtapes.html","My Mixtapes","Owned badge + downloads","rgba(168,85,247,.22)")}
    ${card("/client-vault.html","Client Vault","Portal + access links","rgba(34,211,238,.22)")}
    ${card("/tkfm-catalog.html","Catalog","Public lanes + listings","rgba(59,130,246,.22)")}
    ${card("/support.html","Support","Help + contact","rgba(148,163,184,.22)")}
  </div>

  <div style="margin-top:12px;color:#64748b;font-size:12px;">
    Pro tip: keep the sitemap linked in your header/nav too — that’s your universal “everything works” safety.
  </div>
</section>
`;

function card(href, title, desc, border) {
  return `
    <a href="${href}" style="text-decoration:none;padding:12px 14px;border-radius:14px;border:1px solid ${border};background:rgba(15,23,42,.55);color:#e2e8f0;">
      <div style="font-weight:900;">${title}</div>
      <div style="color:#94a3b8;font-size:12px;margin-top:4px;">${desc}</div>
    </a>`;
}

if (!html.includes("</body>")) {
  console.error("ERROR: index.html missing </body> tag (cannot safely inject).");
  process.exit(1);
}

// Insert just before </body>
html = html.replace("</body>", `${block}\n</body>`);
fs.writeFileSync(file, html, "utf8");
console.log("DONE: Injected Homepage Quick Links + Sitemap button (TKFM_QUICKLINKS_V2).");
