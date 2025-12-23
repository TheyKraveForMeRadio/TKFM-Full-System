function escapeHTML(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function safeNum(n, fallback = 0) {
  const x = Number(n)
  return Number.isFinite(x) ? x : fallback
}

function safeDateLabel(ms) {
  const t = Number(ms)
  if (!Number.isFinite(t) || t <= 0) return 'N/A'
  try {
    return new Date(t).toLocaleDateString()
  } catch {
    return 'N/A'
  }
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

async function loadSponsorStats() {
  const box = document.getElementById('sponsor-stats')
  if (!box) return

  const payload = await safeFetchJSON('/.netlify/functions/public-get-sponsors')
  const data = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])

  if (!data.length) {
    box.innerHTML = `<p>No sponsors active.</p>`
    return
  }

  box.innerHTML = data.map(s => {
    if (!s || typeof s !== 'object') return ''
    const name = escapeHTML(s.name || 'Sponsor')
    const views = safeNum(s.views, 0)
    const expires = safeDateLabel(s.expiresAt)

    return `
      <div class="mixtape-card">
        <strong>${name}</strong><br/>
        👁 Views: ${views.toLocaleString()}<br/>
        ⏱ Expires: ${expires}
      </div>
    `
  }).join('')
}

document.addEventListener('DOMContentLoaded', () => {
  loadSponsorStats()
})
