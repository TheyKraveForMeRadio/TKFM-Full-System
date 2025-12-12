import Stripe from "stripe";
import fs from "fs";

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error("ERROR: STRIPE_SECRET_KEY not set in environment.");
  process.exit(1);
}

const stripe = new Stripe(stripeKey);

const products = [
  { name: "Artist Homepage Post", metadata: { type: "homepage_post" }, prices: [10000, 30000] },
  { name: "Artist Interview", metadata: { type: "interview" }, prices: [5000, 15000] },
  { name: "Artist Spotlight Feature", metadata: { type: "spotlight" }, prices: [15000] },
  { name: "Mixtape Upload", metadata: { type: "mixtape", storage: "audio", max_size_mb: "200" }, prices: [10000] },
  { name: "DJ Single Track Upload", metadata: { type: "dj_upload" }, prices: [5000] },
  { name: "Exclusive Mixtape Hosting", metadata: { type: "hosting" }, prices: [50000, 100000] },
  { name: "Blog / News Premier Feature", metadata: { type: "news_premier" }, prices: [10000] },
  { name: "Donations", metadata: { type: "donation" }, prices: [500, 1000, 2000, 5000] }
];

async function run() {
  const output = [];
  for (const p of products) {
    console.log(`Creating: ${p.name}...`);
    const product = await stripe.products.create({ name: p.name, metadata: p.metadata });
    const createdPrices = [];
    for (const amount of p.prices) {
      const price = await stripe.prices.create({ product: product.id, unit_amount: amount, currency: "usd" });
      createdPrices.push({ id: price.id, unit_amount: price.unit_amount });
    }
    output.push({ product: { id: product.id, name: product.name }, prices: createdPrices });
  }
  fs.writeFileSync("stripe_output.json", JSON.stringify(output, null, 2));
  console.log("✅ All Stripe products & prices created!");
  console.log("➡ stripe_output.json saved.");
}

run().catch(err => { console.error("Error:", err); process.exit(1); });
