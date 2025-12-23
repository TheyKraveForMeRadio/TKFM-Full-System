// TKFM DJ FEATURE ENGINE — ENTERPRISE LOCKED
// Handles DJ-triggered mixtape feature checkout safely

const API = '/.netlify/functions'
const DJ_TOKEN_KEY = 'tkfm_dj_token'

/* ------------------ helpers ------------------ */

function getToken() {
  try {
    return localStorage.getItem(DJ_TOKEN_KEY) || ''
  } catch {
    return ''
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

function safeNum(n, fallback = 0) {
  const x = Number(n)
  return Number.isFinite(x) ? x : fallback
}

async function safeFetchJSON(url, opts = {}, timeoutMs = 8000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      ...opts,
      signal: controller.signal,
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

/* ------------------ core logic ------------------ */

/**
 * Loads mixtapes into the DJ dashboard list
 * Uses public endpoint but only renders DJ controls if token exists
 */
export async function loadDjMixtapes() {
  const box = document.getElementById('dj-mixtape-list')
  if (!box) return

  const data = await safeFetchJSON(`${API}/public-get-mixtapes`)
  const mixtapes = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : []

  if (!mixtapes.length) {
    box.innerHTML = `<p>No mixtapes found.</p>`
    return
  }

  const hasToken = Boolean(getToken())

  box.innerHTML = mixtapes.map(m => {
    const title = escapeHTML(m.title || 'Untitled')
    const dj = escapeHTML(m.djName || '')
    const id = escapeHTML(m.id || '')
    const tier = escapeHTML(m.featureTier || '')
    const expires =
      typeof m.featureExpiresAt === 'number'
        ? new Date(m.featureExpiresAt).toLocaleDateString()
        : null

    return `
      <article class="mixtape-card">
        <strong>${title}</strong><br/>
        ${dj ? `🎧 DJ: ${dj}<br/>` : ''}
        ${
          m.featured
            ? `<span class="badge">FEATURED (${tier.toUpperCase()})</span><br/>⏱ Expires: ${expires}`
            : hasToken
              ? `
                <div class="dj-actions">
                  <button onclick="window.TKFMDJ.featureMixtape('${id}', 'basic')">Feature (Basic)</button>
                  <button onclick="window.TKFMDJ.featureMixtape('${id}', 'pro')">Feature (Pro)</button>
                  <button onclick="window.TKFMDJ.featureMixtape('${id}', 'elite')">Feature (Elite)</button>
                </div>
              `
              : `<em>Login to feature</em>`
        }
      </article>
    `
  }).join('')
}

/**
 * Starts Stripe checkout for a mixtape feature
 */
export async function featureMixtape(mixtapeId, tier) {
  const token = getToken()
  if (!token) {
    alert('Please log in as DJ to feature a mixtape.')
    return
  }

  if (typeof mixtapeId !== 'string' || mixtapeId.length < 3) return
  if (!['basic', 'pro', 'elite'].includes(tier)) return

  const payload = {
    mixtapeId,
    tier,
    successUrl: `${window.location.origin}/success.html`,
    cancelUrl: `${window.location.origin}/mixtapes.html`,
  }

  const res = await safeFetchJSON(
    `${API}/feature-mixtape`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  )

  if (res?.url) {
    window.location.href = res.url
  } else {
    alert('Unable to start checkout. Please try again later.')
  }
}

/* ------------------ bootstrap ------------------ */

window.TKFMDJ = {
  loadDjMixtapes,
  featureMixtape,
}

document.addEventListener('DOMContentLoaded', () => {
  loadDjMixtapes()
})
