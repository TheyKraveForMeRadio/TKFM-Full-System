// TKFM Logo Resolver (AUTO-DETECT)
// Fixes logos even if pages use different src paths.
// It detects any <img> whose src contains tkfm-radio-logo.png or tkfm-records-logo.png
// and swaps to the first reachable candidate path.

const CANDIDATES = {
  radio: [
    "/public/tkfm-radio-logo.png",
    "/tkfm-radio-logo.png",
    "/assets/tkfm-radio-logo.png",
    "/public/public/tkfm-radio-logo.png",
    "/public/assets/tkfm-radio-logo.png",
    "/public/public/assets/tkfm-radio-logo.png"
  ],
  records: [
    "/public/tkfm-records-logo.png",
    "/tkfm-records-logo.png",
    "/assets/tkfm-records-logo.png",
    "/public/public/tkfm-records-logo.png",
    "/public/assets/tkfm-records-logo.png",
    "/public/public/assets/tkfm-records-logo.png"
  ]
};

async function exists(url) {
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    return res.ok;
  } catch (_) {
    return false;
  }
}

async function resolve(kind) {
  const list = CANDIDATES[kind] || [];
  for (const u of list) {
    if (await exists(u)) return u;
  }
  return null;
}

function detectKind(img) {
  const src = String(img.getAttribute("src") || "").toLowerCase();
  const data = String(img.getAttribute("data-tkfm-logo") || "").toLowerCase().trim();
  if (data === "radio" || data === "records") return data;

  if (src.includes("tkfm-radio-logo.png")) return "radio";
  if (src.includes("tkfm-records-logo.png")) return "records";
  return null;
}

async function run() {
  const imgs = Array.from(document.querySelectorAll("img"));
  if (!imgs.length) return;

  const targets = imgs
    .map(img => ({ img, kind: detectKind(img) }))
    .filter(x => x.kind);

  if (!targets.length) return;

  const kinds = Array.from(new Set(targets.map(x => x.kind)));
  const resolved = {};
  for (const k of kinds) resolved[k] = await resolve(k);

  for (const t of targets) {
    const u = resolved[t.kind];
    if (u) {
      t.img.setAttribute("data-tkfm-logo", t.kind);
      t.img.src = u;
    }
  }
}

document.addEventListener("DOMContentLoaded", run);
