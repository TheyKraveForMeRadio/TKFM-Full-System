import Stripe from 'stripe'
import fs from 'fs'
import crypto from 'crypto'

const KEY = process.env.STRIPE_SECRET_KEY
const MODE = (process.env.STRIPE_MODE || '').toLowerCase() // 'test' | 'live'

if (!KEY) {
  console.error('❌ Missing STRIPE_SECRET_KEY')
  process.exit(1)
}
if (MODE !== 'test' && MODE !== 'live') {
  console.error('❌ Missing/invalid STRIPE_MODE. Set STRIPE_MODE=test or STRIPE_MODE=live')
  process.exit(1)
}

// Guardrail: prevent seeding wrong mode by accident
if (MODE === 'live' && !KEY.startsWith('sk_live_')) {
  console.error('❌ STRIPE_MODE=live but key is not sk_live_...')
  process.exit(1)
}
if (MODE === 'test' && !KEY.startsWith('sk_test_')) {
  console.error('❌ STRIPE_MODE=test but key is not sk_test_...')
  process.exit(1)
}

const stripe = new Stripe(KEY, { apiVersion: '2023-10-16' })

/**
 * PRODUCTS + PRICES
 * Add your submission tiers here too (Basic/Spotlight/Boost)
 */
const products = [
  { key: 'homepage_post', name: 'Artist Homepage Post', prices: [10000, 20000, 30000], metadata: { type: 'homepage_post' } },
  { key: 'interview_15', name: 'Artist Interview (15 min)', prices: [5000], metadata: { type: 'interview', duration: '15' } },
  { key: 'interview_30', name: 'Artist Interview (30 min)', prices: [15000], metadata: { type: 'interview', duration: '30' } },
  { key: 'spotlight', name: 'Artist Spotlight Feature', prices: [15000], metadata: { type: 'spotlight' } },
  { key: 'mixtape_upload', name: 'Mixtape Upload', prices: [10000], metadata: { type: 'mixtape', storage: 'audio', max_size_mb: '200' } },
  { key: 'dj_single_track', name: 'DJ Single Track Upload', prices: [5000], metadata: { type: 'dj_single_track' } },
  { key: 'exclusive_hosting', name: 'Exclusive Mixtape Hosting', prices: [50000, 100000], metadata: { type: 'exclusive_mixtape_hosting' } },
  { key: 'donations', name: 'Donations', prices: [500, 1000, 2000, 5000], metadata: { type: 'donation' } },

  // ✅ Submission tiers you asked about
  { key: 'submit_basic', name: 'TKFM Submission — Basic Rotation Review', prices: [5000], metadata: { type: 'submission', tier: 'basic' } },
  { key: 'submit_spotlight', name: 'TKFM Submission — Spotlight', prices: [7500], metadata: { type: 'submission', tier: 'spotlight' } },
  { key: 'submit_boost', name: 'TKFM Submission — Rotation Boost', prices: [25000], metadata: { type: 'submission', tier: 'boost' } },
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

async function safeProductSearch(query) {
  // Stripe Search API may not be enabled; fail soft.
  try {
    return await stripe.products.search({ query, limit: 1 })
  } catch (e) {
    console.warn('⚠️ Product search unavailable or failed; falling back to list scan.')
    return null
  }
}

async function createOrFindProduct(p) {
  const lookup = `tkfm_${p.key || slugify(p.name)}`
  const idempotencyKey = idemKey(`product|${MODE}|${lookup}`)

  // Best: search by metadata key
  const search = await safeProductSearch(`metadata['tkfm_lookup_key']:'${lookup}'`)
  if (search?.data?.length) return search.data[0]

  // Fallback: list scan (limited)
  const list = await stripe.products.list({ limit: 100, active: true })
  const existing = list.data.find(x => x.metadata?.tkfm_lookup_key === lookup)
  if (existing) return existing

  return await stripe.products.create(
    {
      name: p.name,
      metadata: { ...p.metadata, source: 'tkfm', tkfm_lookup_key: lookup },
    },
    { idempotencyKey }
  )
}

async function createOrFindPrice(productId, amount, meta, priceLookupKey) {
  const idempotencyKey = idemKey(`price|${MODE}|${productId}|${amount}`)

  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 })
  const existing = prices.data.find(pr => pr.unit_amount === amount && pr.currency === 'usd')
  if (existing) return existing

  // Stripe supports lookup_key on price (handy for later), but it must be unique.
  // If your account rejects lookup_key for some reason, remove it.
  const createParams = {
    unit_amount: amount,
    currency: 'usd',
    product: productId,
    metadata: { ...meta, source: 'tkfm' },
    lookup_key: priceLookupKey,
  }

  return await stripe.prices.create(createParams, { idempotencyKey })
}

function envLine(k, v) {
  return `${k}=${v}`
}

async function run() {
  console.log(`\n🚀 Seeding Stripe (mode=${MODE})...\n`)

  const output = []
  const allowlist = []
  const env = []

  for (const p of products) {
    console.log(`• Product: ${p.name}`)
    const product = await createOrFindProduct(p)

    const priceIds = []
    for (const amount of p.prices) {
      const priceLookupKey = `tkfm_${p.key}_${amount}_${MODE}`.slice(0, 64)
      const price = await createOrFindPrice(product.id, amount, p.metadata, priceLookupKey)

      priceIds.push(price.id)
      allowlist.push(price.id)
      console.log(`  - $${(amount / 100).toFixed(2)} => ${price.id}`)
    }

    output.push({
      product: product.id,
      name: p.name,
      key: p.key,
      lookup: product.metadata?.tkfm_lookup_key || null,
      prices: priceIds,
      metadata: p.metadata,
    })

    // Helpful explicit ENV mappings (use first price for single-price products)
    if (p.key === 'submit_basic') env.push(envLine('STRIPE_PRICE_SUBMIT_BASIC', priceIds[0]))
    if (p.key === 'submit_spotlight') env.push(envLine('STRIPE_PRICE_SUBMIT_SPOTLIGHT', priceIds[0]))
    if (p.key === 'submit_boost') env.push(envLine('STRIPE_PRICE_SUBMIT_BOOST', priceIds[0]))
  }

  fs.writeFileSync('stripe_output.json', JSON.stringify(output, null, 2), 'utf8')

  const envSnippets = [
    `# Paste into Netlify env vars (${MODE}):`,
    env.join('\n'),
    '',
    `# Global allowlist (optional but recommended for checkout endpoints):`,
    `STRIPE_PRICE_ALLOWLIST=${allowlist.join(',')}`,
    '',
  ].join('\n')

  fs.writeFileSync('stripe_env_snippets.txt', envSnippets, 'utf8')

  console.log('\n✅ Done!')
  console.log('📄 Saved: stripe_output.json')
  console.log('🧩 Saved: stripe_env_snippets.txt\n')
}

run().catch((err) => {
  console.error('❌ Stripe seed failed:', err?.message || err)
  process.exit(1)
})
