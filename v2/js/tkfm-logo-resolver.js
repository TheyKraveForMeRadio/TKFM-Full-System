// TKFM Logo Resolver
// Fixes broken logo paths when publish root changes.
// Usage on images:
//   <img data-tkfm-logo="radio" src="/public/tkfm-radio-logo.png" ...>
//   <img data-tkfm-logo="records" src="/public/tkfm-records-logo.png" ...>

const CANDIDATES = {
  radio: [
    "/public/tkfm-radio-logo.png",
    "/tkfm-radio-logo.png",
    "/public/public/tkfm-radio-logo.png",
    "/assets/tkfm-radio-logo.png"
  ],
  records: [
    "/public/tkfm-records-logo.png",
    "/tkfm-records-logo.png",
    "/public/public/tkfm-records-logo.png",
    "/assets/tkfm-records-logo.png"
  ]
};

async function exists(url) {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
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

async function run() {
  const imgs = Array.from(document.querySelectorAll("img[data-tkfm-logo]"));
  if (!imgs.length) return;

  const kinds = new Set(imgs.map(i => (i.getAttribute("data-tkfm-logo") || "").trim()).filter(Boolean));

  const resolved = {};
  for (const k of kinds) resolved[k] = await resolve(k);

  for (const img of imgs) {
    const k = (img.getAttribute("data-tkfm-logo") || "").trim();
    const u = resolved[k];
    if (u) img.src = u;
  }
}

document.addEventListener("DOMContentLoaded", run);
