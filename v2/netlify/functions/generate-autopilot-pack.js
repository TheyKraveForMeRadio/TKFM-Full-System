import { getStore } from './_helpers.js'

function parseStatusFilter(raw) {
  if (!raw || raw === 'rotation') {
    return ['approved', 'in-contract', 'completed']
  }
  if (raw === 'all') return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

function computeWeight(item) {
  let weight = 1

  const tier = (item.tier || 'custom').toLowerCase()
  switch (tier) {
    case 'starter':
      weight *= 1.0
      break
    case 'pro':
      weight *= 1.3
      break
    case 'elite':
      weight *= 1.7
      break
    case 'custom':
      weight *= 1.1
      break
    default:
      weight *= 1.0
  }

  if (item.featured) {
    weight *= 1.8
  }

  if (item.orderStatus === 'completed') {
    weight *= 1.2
  }

  return weight
}

// Weighted sample without replacement
function weightedSample(items, size) {
  if (!items.length || size <= 0) return []

  const pool = items.map(item => ({
    item,
    weight: computeWeight(item)
  })).filter(e => e.weight > 0)

  const results = []
  while (pool.length && results.length < size) {
    const totalWeight = pool.reduce((acc, e) => acc + e.weight, 0)
    if (totalWeight <= 0) break

    const r = Math.random() * totalWeight
    let running = 0
    let pickedIndex = 0

    for (let i = 0; i < pool.length; i++) {
      running += pool[i].weight
      if (r <= running) {
        pickedIndex = i
        break
      }
    }

    const [picked] = pool.splice(pickedIndex, 1)
    results.push(picked.item)
  }

  return results
}

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: 'ok' }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: 'Method Not Allowed'
    }
  }

  try {
    const params = event.queryStringParameters || {}
    const tierFilter = (params.tier || 'all').toLowerCase()
    const statusRaw = params.status || 'rotation'
    const sizeRaw = parseInt(params.size || '30', 10)

    const statuses = parseStatusFilter(statusRaw)
    const size = Math.max(5, Math.min(sizeRaw || 30, 200))

    const all = (await getStore('mixtapeCatalog')) || []
    const totalCatalog = all.length

    const eligible = all.filter(item => {
      if (item.autopilotEnabled === false) return false

      const status = (item.orderStatus || 'pending-intake').toLowerCase()
      if (statuses.length && !statuses.includes(status)) return false

      const tier = (item.tier || 'custom').toLowerCase()
      if (tierFilter !== 'all' && tier !== tierFilter) return false

      return true
    })

    const eligibleCount = eligible.length
    const picked = weightedSample(eligible, size)

    const payloadItems = picked.map(item => ({
      id: item.id,
      artistName: item.artistName || '',
      projectTitle: item.projectTitle || '',
      email: item.email || '',
      tier: (item.tier || 'custom').toLowerCase(),
      orderStatus: item.orderStatus || 'pending-intake',
      featured: !!item.featured,
      autopilotEnabled: item.autopilotEnabled !== false,
      source: item.source || 'other',
      sourceUploadId: item.sourceUploadId || null,
      sourceOrderId: item.sourceOrderId || null,
      links: item.links || '',
      createdAt: item.createdAt || null,
      updatedAt: item.updatedAt || null
    }))

    const now = new Date().toISOString()

    const response = {
      meta: {
        generatedAt: now,
        sizeRequested: size,
        sizeDelivered: payloadItems.length,
        eligibleCount,
        totalCatalog,
        tierFilter,
        statusFilter: statusRaw,
        note: 'Only entries with autopilotEnabled !== false are eligible. Featured + elite get boosted weight.'
      },
      items: payloadItems
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response)
    }
  } catch (err) {
    console.error('generate-autopilot-pack error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
