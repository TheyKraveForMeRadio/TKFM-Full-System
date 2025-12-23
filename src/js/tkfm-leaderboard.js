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

async function renderLeaderboard() {
  const box = document.getElementById('tkfm-leaderboard')
  if (!box) return

  const payload = await safeFetchJSON('/.netlify/functions/public-get-mixtapes')
  const data = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])
  if (!data.length) return

  const ranked = data
    .filter(m => m && m.featured === true)
    .sort((a, b) => safeNum(b.featuredViews) - safeNum(a.featuredViews))
    .slice(0, 10)

  if (!ranked.length) {
    box.innerHTML = `<p>No featured leaderboard yet.</p>`
    return
  }

  box.innerHTML = ranked.map((m, i) => {
    const tier = safeTier(m.featureTier)
    const title = escapeHTML(m.title || 'Untitled')
    const views = safeNum(m.featuredViews, 0)
    const tierLabel = tier.toUpperCase()

    return `
      <div class="mixtape-card tier-${tier}">
        <strong>#${i + 1} ${title}</strong><br/>
        👁 ${views.toLocaleString()} views<br/>
        🏷 ${tierLabel}
      </div>
    `
  }).join('')
}

document.addEventListener('DOMContentLoaded', () => {
  renderLeaderboard()
})

/**
 * FINAL LOCK NOTE:
 * Do NOT call internal engines (e.g., feature-revenue-engine) from the browser.
 * That endpoint should be cron/admin-only.
 */
