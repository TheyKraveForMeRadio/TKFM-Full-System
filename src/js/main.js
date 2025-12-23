/* 🔥 TKFM MASTER ENTRY — ENTERPRISE LOCKED */

// 🎨 GLOBAL STYLES
import './styles/tkfm-theme.css'

// 🧠 CORE SYSTEMS
import './tkfm-feature-carousel.js'
import './tkfm-leaderboard.js'
import './tkfm-sponsor-rotation.js'
import './tkfm-featured-artist.js'
import './js/tkfm-dj-feature.js'

// -----------------
// Utilities
// -----------------
function escapeHTML(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
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

// -----------------
// HOMEPAGE PIN
// -----------------
async function loadHomepagePin() {
  const el = document.getElementById('homepage-pin')
  if (!el) return

  const data = await safeFetchJSON('/.netlify/functions/public-get-mixtapes')
  if (!Array.isArray(data)) return

  const now = Date.now()
  const pinned = data.find(
    m =>
      m &&
      m.featured === true &&
      m.featureTier === 'elite' &&
      typeof m.featureExpiresAt === 'number' &&
      m.featureExpiresAt > now
  )

  if (!pinned) return

  const title = escapeHTML(pinned.title)
  const dj = escapeHTML(pinned.dj)
  const audioUrl =
    typeof pinned.url === 'string' && pinned.url.startsWith('http')
      ? pinned.url
      : null

  el.innerHTML = `
    <div class="mixtape-card tier-elite">
      <div class="badge">🔥 TOP FEATURE</div>
      <h3>${title}</h3>
      <p>🎧 DJ: ${dj}</p>
      ${
        audioUrl
          ? `<audio controls src="${audioUrl}" style="width:100%"></audio>`
          : `<div class="stream-offline">🔇 Stream unavailable</div>`
      }
    </div>
  `
}

// -----------------
// SPONSOR ROTATION
// -----------------
async function loadSponsor() {
  const slot = document.getElementById('sponsor-slot')
  if (!slot) return

  const sponsor = await safeFetchJSON('/.netlify/functions/sponsor-rotation')
  if (!sponsor || typeof sponsor !== 'object') return

  const name = escapeHTML(sponsor.name)
  const tagline = escapeHTML(sponsor.tagline || '')

  if (!name) return

  slot.innerHTML = `
    <div class="mixtape-card sponsor-card">
      🤝 <strong>${name}</strong><br/>
      ${tagline}
    </div>
  `
}

// -----------------
// INIT
// -----------------
document.addEventListener('DOMContentLoaded', () => {
  // Fire and forget (no await = no page blocking)
  loadHomepagePin()
  loadSponsor()
})
