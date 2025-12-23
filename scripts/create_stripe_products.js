import Stripe from 'stripe'
import fs from 'fs'
import crypto from 'crypto'

const KEY = process.env.STRIPE_SECRET_KEY
const MODE = (process.env.STRIPE_MODE || '').toLowerCase() // require 'test' or 'live'

if (!KEY) {
  console.error('❌ Missing STRIPE_SECRET_KEY')
  process.exit(1)
}
if (MODE !== 'test' && MODE !== 'live') {
  console.error('❌ Missing/invalid STRIPE_MODE. Set STRIPE_MODE=test or STRIPE_MODE=live')
  process.exit(1)
}

// Basic guardrail: prevent seeding live by accident
if (MODE === 'live' && !KEY.startsWith('sk_live_')) {
  console.error('❌ STRIPE_MODE=live but key is not sk_live_...')
  process.exit(1)
}
if (MODE === 'test' && !KEY.startsWith('sk_test_')) {
  console.error('❌ STRIPE_MODE=test but key is not sk_test_...')
  process.exit(1)
}

const stripe = new Stripe(KEY, { apiVersion: '2023-10-16' })

const products = [
  { name: 'Artist Homepage Post', prices: [10000, 20000, 30000], metadata: { type: 'homepage_post' } },
  { name: 'Artist Interview (15 min)', prices: [5000], metadata: { type: 'interview', duration: '15' } },
  { name: 'Artist Interview (30 min)', prices: [15000], metadata: { type: 'interview', duration: '30' } },
  { name: 'Artist Spotlight Feature', prices: [15000], metadata: { type: 'spotlight' } },
  { name: 'Mixtape Upload', prices: [10000], metadata: { type: 'mixtape', storage: 'audio', max_size_mb: '200' } },
  { name: 'DJ Single Track Upload', prices: [5000], metadata: { type: 'dj_single_track' } },
  { name: 'Exclusive Mixtape Hosting', prices: [50000, 100000], metadata: { type: 'exclusive_mixtape_hosting' } },
  { name: 'Donations', prices: [500, 1000, 2000, 5000], metadata: { type: 'donation' } },
]

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64)
}

function idemKey(str) {
  return crypto.createHash('sha256').update(str).digest('hex')
}

async function createOrFindProduct(p) {
  // Use a deterministic lookup key (Stripe supports searching by metadata too, but lookup key is clean)
  const lookup = `tkfm_${slugify(p.name)}`
  const idempotencyKey = idemKey(`product|${MODE}|${lookup}`)

  // Try to find existing product by metadata.lookup_key or name+metadata
  // (Search API is available; we’ll use it to reduce duplicates.)
  const search = await stripe.products.search({
    query: `metadata['tkfm_lookup_key']:'${lookup}'`,
    limit: 1,
  })

  if (search.data.length) return search.data[0]

  return await stripe.products.create(
    {
      name: p.name,
      metadata: { ...p.metadata, source: 'tkfm', tkfm_lookup_key: lookup },
    },
    { idempotencyKey }
  )
}

async function createPrice(productId, amount, meta) {
  const lookup = `tkfm_${productId}_${amount}`
  const idempotencyKey = idemKey(`price|${MODE}|${lookup}`)

  // Try to find an existing active price with same unit_amount/product
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 })
  const existing = prices.data.find(pr => pr.unit_amount === amount && pr.currency === 'usd')
  if (existing) return existing

  return await stripe.prices.create(
    {
      unit_amount: amount,
      currency: 'usd',
      product: productId,
      metadata: { ...meta, source: 'tkfm' },
    },
    { idempotencyKey }
  )
}

async function run() {
  console.log(`\n🚀 Creating Stripe products (mode=${MODE})...\n`)

  const output = []
  const allPriceIds = []

  for (const p of products) {
    console.log(`• Product: ${p.name}`)
    const createdProduct = await createOrFindProduct(p)

    const priceIds = []
    for (const amount of p.prices) {
      const pr = await createPrice(createdProduct.id, amount, p.metadata)
      priceIds.push(pr.id)
      allPriceIds.push(pr.id)
      console.log(`  - $${(amount / 100).toFixed(2)} => ${pr.id}`)
    }

    output.push({
      product: createdProduct.id,
      name: p.name,
      lookup: createdProduct.metadata?.tkfm_lookup_key || null,
      prices: priceIds,
      metadata: p.metadata,
    })
  }

  fs.writeFileSync('stripe_output.json', JSON.stringify(output, null, 2), 'utf8')

  // Useful env snippets for your Netlify FINAL LOCK allowlists
  const envSnippets = [
    `# Paste into Netlify env vars (${MODE}):`,
    `STRIPE_PRICE_ALLOWLIST=${allPriceIds.join(',')}`,
  ].join('\n')

  fs.writeFileSync('stripe_env_snippets.txt', envSnippets + '\n', 'utf8')

  console.log('\n✅ Done!')
  console.log('📄 Saved: stripe_output.json')
  console.log('🧩 Saved: stripe_env_snippets.txt (allowlist for Netlify)\n')
}

run().catch(() => {
  console.error('❌ Stripe seed failed')
  process.exit(1)
})
