import Stripe from "stripe";
import { execSync } from "child_process";
import fs from "fs";

function sh(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
}

const key = sh("netlify env:get STRIPE_SECRET_KEY --context production");
if (!key || !key.startsWith("sk_")) {
  console.log("FAIL: STRIPE_SECRET_KEY not set in Netlify production context");
  process.exit(1);
}
const stripe = new Stripe(key);

function collectVarsFromFile(path) {
  if (!fs.existsSync(path)) return [];
  const txt = fs.readFileSync(path, "utf8");
  return txt
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => l.split("=")[0].trim())
    .filter((k) => k.startsWith("STRIPE_PRICE_"));
}

// Collect from .env plus any env example files if they exist
const vars = new Set([
  ...collectVarsFromFile(".env"),
  ...collectVarsFromFile(".env.example"),
  ...collectVarsFromFile(".env.local"),
]);

// If your repo doesn’t list them, fall back to a known grep over code for STRIPE_PRICE_
if (vars.size === 0) {
  const grep = sh('bash -lc "grep -Rho \\"STRIPE_PRICE_[A-Z0-9_]*\\" -n . | sort -u"');
  grep.split(/\r?\n/).forEach((v) => v && vars.add(v.trim()));
}

const all = [...vars].sort();
if (!all.length) {
  console.log("FAIL: Could not find any STRIPE_PRICE_ variable names in repo/env files.");
  process.exit(1);
}

let ok=0, fail=0, missing=0;

for (const v of all) {
  let priceId = "";
  try {
    priceId = sh(`netlify env:get ${v} --context production`);
  } catch {
    priceId = "";
  }

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
