import Stripe from "stripe";
import { execSync } from "child_process";

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
}

const key = sh("netlify env:get STRIPE_SECRET_KEY --context production");
if (!key || !key.startsWith("sk_")) {
  console.log("FAIL: STRIPE_SECRET_KEY not set in Netlify production context");
  process.exit(1);
}

const stripe = new Stripe(key);

const list = sh("netlify env:list --context production");
const vars = list
  .split("\n")
  .map((l) => l.trim().split(/\s+/)[0])
  .filter((v) => v.startsWith("STRIPE_PRICE_"));

let ok = 0, fail = 0, skip = 0;

for (const v of vars) {
  const priceId = sh(`netlify env:get ${v} --context production`);
  if (!priceId || !priceId.startsWith("price_")) {
    skip++;
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

console.log(`RESULT OK=${ok} FAIL=${fail} SKIP=${skip}`);
