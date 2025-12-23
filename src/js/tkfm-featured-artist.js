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

function escapeHTML(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function safeInt(n, fallback = 0) {
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}

async function loadFeaturedArtist() {
  const box = document.getElementById('featured-artist')
  if (!box) return

  const data = await safeFetchJSON('/.netlify/functions/public-get-featured-artists')
  if (!Array.isArray(data) || data.length === 0) return

  const artist = data[0]
  if (!artist || typeof artist !== 'object') return

  const name = escapeHTML(artist.name || 'Featured Artist')
  const totalViews = safeInt(artist.totalViews, 0)

  box.innerHTML = `
    <div class="mixtape-card tier-elite featured">
      <div class="badge">👑 FEATURED ARTIST</div>
      <h2>${name}</h2>
      <p>🔥 Total Views: ${totalViews.toLocaleString()}</p>
      <p>⏱ Spotlight Active</p>
    </div>
  `
}

document.addEventListener('DOMContentLoaded', () => {
  // fire-and-forget; no UI blocking
  loadFeaturedArtist()
})
