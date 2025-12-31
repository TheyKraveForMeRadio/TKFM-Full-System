import fs from "fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function uniq(arr) {
  return [...new Set(arr)].sort();
}

function extractDataPlans(html) {
  const re = /data-plan="([^"]+)"/g;
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return uniq(out);
}

function extractPriceMap(js) {
  // key: process.env.STRIPE_PRICE_SOMETHING
  // supports comments/spacing
  const re = /^\s*([a-z0-9_]+)\s*:\s*process\.env\.(STRIPE_PRICE_[A-Z0-9_]+)\s*,?\s*$/gmi;
  const map = {};
  let m;
  while ((m = re.exec(js))) {
    map[m[1]] = m[2];
  }
  return map;
}

function main() {
  const pricingPath = "pricing.html";
  const funcPath = "netlify/functions/create-checkout-session.js";

  if (!fs.existsSync(pricingPath)) {
    console.error("MISSING pricing.html");
    process.exit(1);
  }
  if (!fs.existsSync(funcPath)) {
    console.error("MISSING netlify/functions/create-checkout-session.js");
    process.exit(1);
  }

  const plans = extractDataPlans(read(pricingPath));
  const priceMap = extractPriceMap(read(funcPath));
  const mappedKeys = Object.keys(priceMap).sort();

  const missingInMap = plans.filter(id => !mappedKeys.includes(id));

  // expected env var: from mapping if exists; otherwise default rule
  const rows = plans.map(id => {
    const envName = priceMap[id] || ("STRIPE_PRICE_" + id.toUpperCase());
    const hasLocal = !!process.env[envName];
    return { id, envName, mapped: !!priceMap[id], localEnv: hasLocal ? "SET" : "MISSING" };
  });

  console.log("\n=== STRIPE AUDIT (pricing.html -> checkout mapping) ===\n");

  console.log("Plans found in pricing.html:", plans.length);
  console.log("Keys mapped in create-checkout-session.js:", mappedKeys.length);

  if (missingInMap.length) {
    console.log("\nMISSING IN PRICE_MAP (these WILL fail checkout):");
    missingInMap.forEach(x => console.log(" -", x));
  } else {
    console.log("\nOK: every data-plan is mapped in PRICE_MAP.");
  }

  console.log("\nENV VARS TO SET IN NETLIFY (name per id):");
  rows.forEach(r => {
    const tag = r.mapped ? "MAPPED" : "NOT_MAPPED";
    console.log(`${r.envName}=${tag}`);
  });

  console.log("\nDETAIL (id | env | mapped | localEnv):");
  rows.forEach(r => {
    console.log(`${r.id} | ${r.envName} | ${r.mapped ? "YES" : "NO"} | ${r.localEnv}`);
  });

  // Exit non-zero if any missing mapping
  if (missingInMap.length) process.exit(2);
}

main();
