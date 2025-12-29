import { getStore } from './_helpers.js'

function tierWeight(tier) {
  if (!tier) return 1
  const t = String(tier).toLowerCase()
  if (t === 'elite') return 3
  if (t === 'pro') return 2
  if (t === 'starter') return 1.5
  return 1
}

function statusWeight(status) {
  if (!status) return 0
  const s = String(status)
  switch (s) {
    case 'completed': return 3
    case 'in-contract': return 2
    case 'approved': return 1
    default: return 0
  }
}

function daysAgo(iso) {
  if (!iso) return 999
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 999
  const now = Date.now()
  return (now - d.getTime()) / (1000 * 60 * 60 * 24)
}

export async function handler(event) {
  try {
    const params = event.queryStringParameters || {}
    const sizeParam = parseInt(params.size, 10)
    const size = Number.isFinite(sizeParam) && sizeParam > 0 ? Math.min(sizeParam, 50) : 12

    // Optional filters
    const tierFilter = params.tier || '' // single tier or ""
    const statusFilter = params.status || '' // comma separated or ""

    const catalog = (await getStore('mixtapeCatalog')) || []
    const total = catalog.length

    let eligible = catalog.slice()

    // Filter by status list if provided
    if (statusFilter) {
      const allowed = statusFilter.split(',').map(s => s.trim()).filter(Boolean)
      if (allowed.length) {
        eligible = eligible.filter(item => allowed.includes(item.orderStatus || ''))
      }
    } else {
      // Default: only pull from approved / in-contract / completed
      const allowedDefault = new Set(['approved', 'in-contract', 'completed'])
      eligible = eligible.filter(item => allowedDefault.has(item.orderStatus || ''))
    }

    // Filter by tier if provided
    if (tierFilter) {
      eligible = eligible.filter(item => (item.tier || '') === tierFilter)
    }

    // Score each item
    const now = new Date()
    const scored = eligible.map(item => {
      const tw = tierWeight(item.tier)
      const sw = statusWeight(item.orderStatus)
      const ageDays = daysAgo(item.updatedAt || item.createdAt)
      const recencyScore = Math.max(0, 30 - ageDays) / 20 // 0..1.5 approx
      const score = tw + sw + recencyScore

      return {
        ...item,
        _score: score
      }
    })

    // Sort by score DESC, then most recently updated
    scored.sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score
      const da = new Date(a.updatedAt || a.createdAt || 0).getTime()
      const db = new Date(b.updatedAt || b.createdAt || 0).getTime()
      return db - da
    })

    const selected = scored.slice(0, size)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        meta: {
          totalCatalog: total,
          eligibleCount: eligible.length,
          sizeRequested: size,
          sizeDelivered: selected.length,
          generatedAt: now.toISOString(),
          tierFilter: tierFilter || null,
          statusFilter: statusFilter || 'approved,in-contract,completed'
        },
        items: selected
      })
    }
  } catch (err) {
    console.error('get-autopilot-rotation error:', err)
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
