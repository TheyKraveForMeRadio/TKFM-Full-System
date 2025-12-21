/* 🔥 TKFM MASTER ENTRY — DO NOT SPLIT */

// 🎨 GLOBAL STYLES
import './styles/tkfm-theme.css'

// 🧠 CORE SYSTEMS
import './tkfm-feature-carousel.js'
import './tkfm-leaderboard.js'
import './tkfm-sponsor-rotation.js'
import './tkfm-featured-artist.js'
import './js/tkfm-dj-feature.js'

// HOMEPAGE PIN
async function loadHomepagePin() {
  const el = document.getElementById('homepage-pin')
  if (!el) return

  const res = await fetch('/.netlify/functions/public-get-mixtapes')
  const data = await res.json()

  const pinned = data.find(
    m => m.featured && m.featureTier === 'elite' && m.featureExpiresAt > Date.now()
  )

  if (!pinned) return

  el.innerHTML = `
    <div class="mixtape-card tier-elite">
      <div class="badge">🔥 TOP FEATURE</div>
      <h3>${pinned.title}</h3>
      <p>🎧 DJ: ${pinned.dj}</p>
      ${
        pinned.url
          ? `<audio controls src="${pinned.url}" style="width:100%"></audio>`
          : `<div class="stream-offline">🔇 Stream unavailable</div>`
      }
    </div>
  `
}

// SPONSOR ROTATION
async function loadSponsor() {
  const slot = document.getElementById('sponsor-slot')
  if (!slot) return

  const res = await fetch('/.netlify/functions/sponsor-rotation')
  if (!res.ok) return
  const sponsor = await res.json()
  if (!sponsor) return

  slot.innerHTML = `
    <div class="mixtape-card sponsor-card">
      🤝 <strong>${sponsor.name}</strong><br/>
      ${sponsor.tagline || ''}
    </div>
  `
}

document.addEventListener('DOMContentLoaded', () => {
  loadHomepagePin()
  loadSponsor()
})
