import Stripe from "stripe";
import { execSync } from "child_process";

function sh(cmd) {
  const wrapped = `bash -lc ${JSON.stringify(cmd + " || true")}`;
  return execSync(wrapped, { stdio: ["ignore", "pipe", "pipe"] }).toString();
}

function shTrim(cmd) {
  return sh(cmd).toString().trim();
}

const key = shTrim("netlify env:get STRIPE_SECRET_KEY --context production");
if (!key || !key.startsWith("sk_")) {
  console.log("FAIL: STRIPE_SECRET_KEY not set in Netlify production context (or Netlify CLI not logged in).");
  process.exit(1);
}

const stripe = new Stripe(key);

const rawList = sh("netlify env:list --context production 2>/dev/null").toString();

const names = new Set();
rawList.split(/\r?\n/).forEach((line) => {
  const l = line.trim();
  if (!l) return;
  if (l.startsWith("|")) {
    const cols = l.split("|").map(s => s.trim()).filter(Boolean);
    if (cols.length) names.add(cols[0]);
    return;
  }
  const first = l.split(/\s+/)[0];
  if (first && /^[A-Z0-9_]+$/.test(first)) names.add(first);
});

const priceVars = [...names].filter(v => v.startsWith("STRIPE_PRICE_")).sort();
if (!priceVars.length) {
  console.log("FAIL: No STRIPE_PRICE_* vars found in Netlify production env:list output.");
  console.log("TIP: Run `netlify env:list --context production` manually to confirm CLI output.");
  process.exit(1);
}

let ok=0, fail=0, missing=0;

for (const v of priceVars) {
  const priceId = shTrim(`netlify env:get ${v} --context production 2>/dev/null`);
  if (!priceId || !priceId.startsWith("price_")) {
    console.log(`MISSING ${v} -> ${priceId || "No value"}`);
    missing++;
    continue;
  }
  try {
    await stripe.prices.retrieve(priceId);
    console.log(`OK   ${v} -> ${priceId}`);
    ok++;
  } catch (e) {
    console.log(`FAIL ${v} -> ${priceId} :: ${e?.message || e}`);
    fail++;
  }
}

console.log(`RESULT OK=${ok} FAIL=${fail} MISSING=${missing}`);
