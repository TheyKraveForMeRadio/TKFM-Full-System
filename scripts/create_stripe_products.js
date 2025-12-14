import Stripe from "stripe";
import fs from "fs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ Missing STRIPE_SECRET_KEY");
  process.exit(1);
}

const products = [
  {
    name: "Artist Homepage Post",
    prices: [10000, 20000, 30000],
    metadata: { type: "homepage_post" }
  },
  {
    name: "Artist Interview (15 min)",
    prices: [5000],
    metadata: { type: "interview", duration: "15" }
  },
  {
    name: "Artist Interview (30 min)",
    prices: [15000],
    metadata: { type: "interview", duration: "30" }
  },
  {
    name: "Artist Spotlight Feature",
    prices: [15000],
    metadata: { type: "spotlight" }
  },
  {
    name: "Mixtape Upload",
    prices: [10000],
    metadata: { type: "mixtape", storage: "audio", max_size_mb: "200" }
  },
  {
    name: "DJ Single Track Upload",
    prices: [5000],
    metadata: { type: "dj_single_track" }
  },
  {
    name: "Exclusive Mixtape Hosting",
    prices: [50000, 100000],
    metadata: { type: "exclusive_mixtape_hosting" }
  },
  {
    name: "Donations",
    prices: [500, 1000, 2000, 5000],
    metadata: { type: "donation" }
  }
];

async function run() {
  console.log("\n🚀 Creating Stripe products...\n");

  const output = [];

  for (const product of products) {
    console.log(`Creating: ${product.name}...`);

    const createdProduct = await stripe.products.create({
      name: product.name,
      metadata: product.metadata
    });

    const priceIds = [];

    for (const amount of product.prices) {
      const price = await stripe.prices.create({
        unit_amount: amount,
        currency: "usd",
        product: createdProduct.id
      });
      priceIds.push(price.id);
    }

    output.push({
      product: createdProduct.id,
      name: product.name,
      prices: priceIds
    });
  }

  fs.writeFileSync("stripe_output.json", JSON.stringify(output, null, 2));

  console.log("\n✅ All Stripe products created!");
  console.log("📄 Saved to stripe_output.json\n");
}

run();
