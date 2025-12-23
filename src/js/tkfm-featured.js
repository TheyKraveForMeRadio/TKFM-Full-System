// 🔥 TKFM FEATURED MIXTAPES ENGINE — ENTERPRISE LOCKED

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
  // allow only http(s) to avoid javascript:/data: injection
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

/**
 * Fetch featured mixtapes
 * - Works with array response OR { data: [...] }
 * - Sanitizes all text
 * - Validates URLs
 * - Fails closed (no crashes)
 */
export async function loadFeaturedMixtapes() {
  const container = document.getElementById('featuredList')
  if (!container) return

  const payload = await safeFetchJSON('/.netlify/functions/public-get-mixtapes')
  const items = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])

  if (!items.length) {
    container.innerHTML = `<p>No featured mixtapes right now.</p>`
    return
  }

  const featured = items.filter(m => m && m.featured === true)
  if (!featured.length) {
    container.innerHTML = `<p>No featured mixtapes right now.</p>`
    return
  }

  container.innerHTML = featured.map(m => {
    const title = escapeHTML(m.title || 'Untitled')
    const artist = escapeHTML(m.artist || m.dj || '')
    const coverUrl = safeURL(m.coverUrl || '')
    const audioUrl = safeURL(m.audioUrl || m.url || '')

    return `
      <article class="mixtape-card">
        <h3>${title}</h3>
        ${artist ? `<p>by ${artist}</p>` : ''}
        ${
          coverUrl
            ? `<img src="${coverUrl}" alt="${title}" loading="lazy" />`
            : ''
        }
        ${
          audioUrl
            ? `<audio controls src="${audioUrl}" style="width:100%"></audio>`
            : `<div class="stream-offline">🔇 Stream unavailable</div>`
        }
      </article>
    `
  }).join('')
}
