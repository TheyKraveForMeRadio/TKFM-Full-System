let i = 0
let running = false

function escapeHTML(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function safeTier(tier) {
  // Only allow known tiers to prevent class injection
  const allowed = new Set(['basic', 'pro', 'elite'])
  return allowed.has(tier) ? tier : 'basic'
}

function safeURL(url) {
  if (typeof url !== 'string') return ''
  if (url.startsWith('https://') || url.startsWith('http://')) return url
  return ''
}

async function safeFetchJSON(url, timeoutMs = 6000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

async function trackFeatureView(mixtapeId) {
  if (typeof mixtapeId !== 'string' || mixtapeId.length < 3 || mixtapeId.length > 128) return
  try {
    await fetch('/.netlify/functions/track-feature-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mixtapeId }),
    })
  } catch {
    // silent
  }
}

async function tickFeaturedCarousel() {
  if (running) return
  running = true

  try {
    const el = document.getElementById('featured-carousel')
    if (!el) return

    const data = await safeFetchJSON('/.netlify/functions/public-get-mixtapes')
    if (!Array.isArray(data)) return

    const now = Date.now()
    const featured = data.filter(
      m =>
        m &&
        m.featured === true &&
        typeof m.featureExpiresAt === 'number' &&
        m.featureExpiresAt > now
    )
    if (!featured.length) return

    const m = featured[i % featured.length]
    if (!m || typeof m !== 'object') return

    const title = escapeHTML(m.title || 'Featured')
    const tier = safeTier(m.featureTier)
    const audioUrl = safeURL(m.audioUrl || m.url || '')
    const id = typeof m.id === 'string' ? m.id : ''

    // Render safely (minimal innerHTML with escaped values)
    el.innerHTML = `
      <div class="mixtape-card featured tier-${tier}">
        <strong>${title}</strong>
        ${
          audioUrl
            ? `<audio controls src="${audioUrl}" style="width:100%"></audio>`
            : `<div class="stream-offline">🔇 Stream unavailable</div>`
        }
      </div>
    `

    if (id) trackFeatureView(id)
    i++
  } finally {
    running = false
  }
}

// No overlap: tick every 5s but skip if prior run still active
setInterval(() => { tickFeaturedCarousel() }, 5000)

// Optional: run once immediately on load
tickFeaturedCarousel()
