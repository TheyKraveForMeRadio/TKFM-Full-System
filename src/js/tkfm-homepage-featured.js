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
  if (url.startsWith('https://') || url.startsWith('http://')) return url
  return ''
}

function safeTier(tier) {
  const allowed = new Set(['basic', 'pro', 'elite'])
  return allowed.has(tier) ? tier : 'basic'
}

function safeNum(n, fallback = 0) {
  const x = Number(n)
  return Number.isFinite(x) ? x : fallback
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

async function loadHomepageAI() {
  const box = document.getElementById('featured-mixtapes')
  if (!box) return

  const payload = await safeFetchJSON('/.netlify/functions/public-get-mixtapes')
  const data = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])
  if (!data.length) return

  const now = Date.now()

  // Pick the pinned king (prefer active + best score if multiple)
  const kings = data
    .filter(m => m && m.homepagePin === true)
    .sort((a, b) => safeNum(b.aiScore) - safeNum(a.aiScore))

  const king = kings[0] || null

  const runners = data
    .filter(m =>
      m &&
      m.featured === true &&
      m.homepagePin !== true &&
      // keep it “live” if your backend doesn’t already filter
      (typeof m.featureExpiresAt !== 'number' || m.featureExpiresAt > now)
    )
    .sort((a, b) => safeNum(b.aiScore) - safeNum(a.aiScore))
    .slice(0, 4)

  const kingHTML = king
    ? (() => {
        const title = escapeHTML(king.title || 'AI Pick')
        const dj = escapeHTML(king.djName || king.dj || '')
        const audioUrl = safeURL(king.audioUrl || king.url || '')
        const score = safeNum(king.aiScore, 0)

        return `
          <div class="mixtape-card tier-elite featured">
            <div class="badge">👑 AI #1 PICK</div>
            <h2>${title}</h2>
            ${dj ? `<p>🎧 DJ: ${dj}</p>` : ''}
            ${
              audioUrl
                ? `<audio controls src="${audioUrl}" style="width:100%"></audio>`
                : `<div class="stream-offline">🔇 Stream unavailable</div>`
            }
            <p>🔥 Score: ${score.toFixed(2)}</p>
          </div>
        `
      })()
    : ''

  const runnersHTML = runners
    .map(m => {
      const tier = safeTier(m.featureTier)
      const title = escapeHTML(m.title || 'Trending')
      const score = safeNum(m.aiScore, 0)

      return `
        <div class="mixtape-card tier-${tier}">
          <div class="badge">🔥 TRENDING</div>
          <strong>${title}</strong><br/>
          Score: ${score.toFixed(2)}
        </div>
      `
    })
    .join('')

  box.innerHTML = `${kingHTML}${runnersHTML}`
}

document.addEventListener('DOMContentLoaded', () => {
  loadHomepageAI()
})
