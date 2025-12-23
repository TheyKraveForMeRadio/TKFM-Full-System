let sponsorIndex = 0
let sponsors = []
const INTERVAL = 7000
let rotationTimer = null

function escapeHTML(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function safeURL(url) {
  if (typeof url !== 'string') return ''
  // Allow only http(s)
  if (url.startsWith('https://') || url.startsWith('http://')) return url
  return ''
}

async function safeFetchJSON(url, timeoutMs = 8000) {
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

function stopRotation() {
  if (rotationTimer) clearInterval(rotationTimer)
  rotationTimer = null
}

function nextSponsor() {
  if (!Array.isArray(sponsors) || sponsors.length === 0) return
  sponsorIndex = (sponsorIndex + 1) % sponsors.length
  renderSponsor()
}

async function trackSponsorView(sponsorId) {
  if (typeof sponsorId !== 'string' || sponsorId.length < 3 || sponsorId.length > 128) return
  try {
    await fetch('/.netlify/functions/track-sponsor-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sponsorId }),
    })
  } catch {
    // silent
  }
}

function renderSponsor() {
  const box = document.getElementById('tkfm-sponsor-slot')
  if (!box) return
  if (!Array.isArray(sponsors) || sponsors.length === 0) return

  const s = sponsors[sponsorIndex]
  if (!s || typeof s !== 'object') return

  const name = escapeHTML(s.name || 'Sponsor')
  const link = safeURL(s.link || '')
  const image = safeURL(s.image || s.imageUrl || '')

  // If link or image is missing, fail closed (don't render unsafe HTML)
  if (!link || !image) return

  box.innerHTML = `
    <a href="${link}" target="_blank" rel="noopener noreferrer" class="sponsor-card">
      <img src="${image}" alt="${name}" loading="lazy" />
      <div class="sponsor-label">Sponsored</div>
    </a>
  `

  const id = typeof s.id === 'string' ? s.id : ''
  if (id) trackSponsorView(id)
}

async function loadSponsors() {
  stopRotation()

  const payload = await safeFetchJSON('/.netlify/functions/public-get-sponsors')
  const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])

  sponsors = list.filter(x => x && typeof x === 'object')
  sponsorIndex = 0

  if (!sponsors.length) return

  renderSponsor()
  rotationTimer = setInterval(nextSponsor, INTERVAL)
}

document.addEventListener('DOMContentLoaded', () => {
  loadSponsors()
})
