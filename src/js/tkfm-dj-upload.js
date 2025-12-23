const API = '/.netlify/functions'
const DJ_TOKEN = 'tkfm_dj_token'

// ---------- Utilities ----------
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
  // allow https/http only (avoid javascript: / data:)
  if (url.startsWith('https://') || url.startsWith('http://')) return url
  return ''
}

async function safeFetchJSON(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    const text = await res.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch { data = null }
    return { ok: res.ok, status: res.status, data }
  } catch {
    return { ok: false, status: 0, data: null }
  } finally {
    clearTimeout(t)
  }
}

function getToken() {
  return localStorage.getItem(DJ_TOKEN) || ''
}

function setError(msg) {
  if (typeof djError !== 'undefined' && djError) djError.textContent = msg || ''
}

// ---------- Auth ----------
async function djLogin() {
  setError('')

  const email = (djEmail?.value || '').trim()
  const password = (djPassword?.value || '').trim()

  if (!email || !password) {
    setError('Email and password required.')
    return
  }

  const { ok, data } = await safeFetchJSON(`${API}/dj-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!ok || !data || data.ok !== true || typeof data.token !== 'string') {
    setError((data && data.error) ? String(data.error) : 'Login failed.')
    return
  }

  localStorage.setItem(DJ_TOKEN, data.token)
  showDashboard()
}

function showDashboard() {
  document.getElementById('dj-login')?.classList.add('hidden')
  document.getElementById('dj-dashboard')?.classList.remove('hidden')
  loadMixtapes()
}

function logout() {
  localStorage.removeItem(DJ_TOKEN)
  location.reload()
}

// ---------- Upload ----------
async function uploadMixtape() {
  setError('')

  const title = (mixTitle?.value || '').trim()
  const coverFile = mixCover?.files?.[0]
  const audioFile = mixAudio?.files?.[0]

  if (!title || !coverFile || !audioFile) {
    setError('Title, cover, and audio are required.')
    return
  }

  const token = getToken()
  if (!token) {
    setError('Session expired. Please log in again.')
    return
  }

  const form = new FormData()
  form.append('title', title)
  form.append('cover', coverFile)
  form.append('audio', audioFile)

  const { ok, data } = await safeFetchJSON(`${API}/dj-upload-mixtape`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: form,
  }, 20000)

  if (!ok) {
    setError((data && data.error) ? String(data.error) : 'Upload failed.')
    return
  }

  await loadMixtapes()
}

// ---------- Mixtapes ----------
function renderMixtapes(items) {
  if (!mixtapeList) return
  mixtapeList.innerHTML = ''

  const frag = document.createDocumentFragment()

  items.forEach((m) => {
    if (!m || typeof m !== 'object') return

    const id = typeof m.id === 'string' ? m.id : ''
    const title = escapeHTML(m.title || 'Untitled')
    const audioUrl = safeURL(m.audioUrl || m.url || '')

    const article = document.createElement('article')

    const h3 = document.createElement('h3')
    h3.innerHTML = title
    article.appendChild(h3)

    const audio = document.createElement('audio')
    audio.controls = true
    if (audioUrl) audio.src = audioUrl
    article.appendChild(audio)

    const btn = document.createElement('button')
    btn.textContent = '🔥 Feature This Mixtape'
    btn.disabled = !id
    btn.addEventListener('click', () => featureMixtape(id))
    article.appendChild(btn)

    frag.appendChild(article)
  })

  mixtapeList.appendChild(frag)
}

async function loadMixtapes() {
  const { ok, data } = await safeFetchJSON(`${API}/public-get-mixtapes`, { method: 'GET' })

  if (!ok || !data) {
    // fail silent (dashboard still usable)
    renderMixtapes([])
    return
  }

  // Support either: array response OR { data: [...] }
  const items = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : [])
  renderMixtapes(items)
}

// ---------- Stripe Checkout ----------
async function featureMixtape(mixtapeId) {
  setError('')

  const token = getToken()
  if (!token) {
    setError('Session expired. Please log in again.')
    return
  }

  if (typeof mixtapeId !== 'string' || mixtapeId.length < 3 || mixtapeId.length > 128) {
    setError('Invalid mixtape.')
    return
  }

  const { ok, data } = await safeFetchJSON(`${API}/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: 'FEATURE_MIXTAPE',
      mixtapeId,
    }),
  })

  if (!ok || !data || typeof data.url !== 'string') {
    setError((data && data.error) ? String(data.error) : 'Checkout failed.')
    return
  }

  // Redirect
  window.location.href = data.url
}

// Expose functions if your HTML calls them directly
window.djLogin = djLogin
window.logout = logout
window.uploadMixtape = uploadMixtape
