// admin/news.js — ENTERPRISE LOCKED ADMIN NEWS UI

const API = '/.netlify/functions'
const TOKEN_KEY = 'tkfm_admin_token'

const $ = (id) => document.getElementById(id)

function escapeHTML(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function safeDate(d) {
  try {
    const dt = new Date(d)
    if (isNaN(dt.getTime())) return ''
    return dt.toLocaleString()
  } catch { return '' }
}

function token() {
  try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

function setToken(t) {
  try { localStorage.setItem(TOKEN_KEY, t) } catch {}
}

function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY) } catch {}
}

async function fetchJSON(url, opts = {}, timeoutMs = 10000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal })
    const text = await res.text()
    let json = null
    try { json = text ? JSON.parse(text) : null } catch {}
    return { ok: res.ok, status: res.status, json }
  } catch {
    return { ok: false, status: 0, json: null }
  } finally {
    clearTimeout(t)
  }
}

function showMsg(el, msg, cls = 'muted') {
  el.className = cls
  el.textContent = msg || ''
}

function showApp(on) {
  $('loginCard').classList.toggle('hidden', on)
  $('app').classList.toggle('hidden', !on)
}

function showEdit(on) {
  $('editCard').classList.toggle('hidden', !on)
}

function setTokenStatus(text, cls) {
  $('tokenStatus').textContent = text
  $('tokenStatus').className = cls
}

async function adminLogin() {
  showMsg($('loginMsg'), 'Logging in...', 'muted')

  const email = $('adminEmail').value.trim()
  const password = $('adminPassword').value

  const { ok, json } = await fetchJSON(`${API}/admin-auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  if (!ok || !json?.token) {
    showMsg($('loginMsg'), 'Login failed', 'danger')
    return
  }

  setToken(json.token)
  showMsg($('loginMsg'), 'Logged in', 'ok')
  showApp(true)
  await verifyToken()
  await refreshList()
}

async function verifyToken() {
  const t = token()
  if (!t) {
    setTokenStatus('missing', 'danger')
    return
  }

  const { ok } = await fetchJSON(`${API}/admin-verify`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${t}` }
  })

  if (!ok) {
    setTokenStatus('invalid', 'danger')
    showMsg($('globalMsg'), 'Token invalid — login again', 'danger')
    clearToken()
    showApp(false)
    return
  }

  setTokenStatus('valid', 'ok')
  showMsg($('globalMsg'), 'Verified', 'ok')
}

async function createNews() {
  const t = token()
  if (!t) return

  const title = $('newsTitle').value.trim()
  const body = $('newsBody').value.trim()
  const image_url = $('newsImage').value.trim()
  const published = $('newsPublished').checked

  showMsg($('createMsg'), 'Creating...', 'muted')

  const { ok, json } = await fetchJSON(`${API}/admin-create-news`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${t}`
    },
    body: JSON.stringify({ title, body, image_url: image_url || null, published })
  })

  if (!ok || !json?.ok) {
    showMsg($('createMsg'), 'Create failed', 'danger')
    return
  }

  showMsg($('createMsg'), 'Created', 'ok')
  $('newsTitle').value = ''
  $('newsBody').value = ''
  $('newsImage').value = ''
  $('newsPublished').checked = false

  await refreshList()
}

async function refreshList() {
  const t = token()
  if (!t) return

  showMsg($('globalMsg'), 'Loading...', 'muted')

  const pub = $('filterPublished').value
  const url = `${API}/admin-list-news?limit=50&offset=0&published=${encodeURIComponent(pub)}`

  const { ok, json } = await fetchJSON(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${t}` }
  })

  if (!ok || !json?.ok) {
    showMsg($('globalMsg'), 'Load failed', 'danger')
    return
  }

  renderList(json.data || [])
  showMsg($('globalMsg'), 'Loaded', 'ok')
}

async function searchNews() {
  const t = token()
  if (!t) return

  const q = $('searchQ').value.trim()
  const pub = $('filterPublished').value

  if (!q) {
    await refreshList()
    return
  }

  showMsg($('globalMsg'), 'Searching...', 'muted')

  const url = `${API}/admin-search-news?q=${encodeURIComponent(q)}&published=${encodeURIComponent(pub)}&limit=50`

  const { ok, json } = await fetchJSON(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${t}` }
  })

  if (!ok || !json?.ok) {
    showMsg($('globalMsg'), 'Search failed', 'danger')
    return
  }

  renderList(json.data || [])
  showMsg($('globalMsg'), `Found ${(json.data || []).length}`, 'ok')
}

function renderList(items) {
  $('count').textContent = String(items.length)

  if (!items.length) {
    $('newsList').innerHTML = `<p class="muted">No results.</p>`
    return
  }

  $('newsList').innerHTML = items.map(n => {
    const id = escapeHTML(n.id || '')
    const title = escapeHTML(n.title || 'Untitled')
    const author = escapeHTML(n.author || '')
    const created = safeDate(n.created_at)
    const pub = n.published === true

    return `
      <article>
        <h3>${title}</h3>
        <div class="meta">
          ${pub ? '<span class="badge ok">PUBLISHED</span>' : '<span class="badge warn">DRAFT</span>'}
          ${author ? ` • ${author}` : ''}
          ${created ? ` • ${created}` : ''}
        </div>
        <div class="actions">
          <button data-edit="${id}">Edit</button>
          <button data-toggle="${id}" data-pub="${pub ? '1' : '0'}">${pub ? 'Unpublish' : 'Publish'}</button>
          <button data-del="${id}" class="danger">Delete</button>
        </div>
      </article>
    `
  }).join('')

  // wire buttons
  $('newsList').querySelectorAll('button[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEdit(btn.getAttribute('data-edit')))
  })

  $('newsList').querySelectorAll('button[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => togglePublish(btn.getAttribute('data-toggle'), btn.getAttribute('data-pub') !== '1'))
  })

  $('newsList').querySelectorAll('button[data-del]').forEach(btn => {
    btn.addEventListener('click', () => deleteNews(btn.getAttribute('data-del')))
  })
}

async function openEdit(id) {
  const t = token()
  if (!t) return

  showMsg($('editMsg'), 'Loading...', 'muted')
  $('editId').textContent = id
  showEdit(true)

  const url = `${API}/admin-get-news-by-id?id=${encodeURIComponent(id)}`
  const { ok, json } = await fetchJSON(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${t}` }
  })

  if (!ok || !json?.ok || !json?.data) {
    showMsg($('editMsg'), 'Not found', 'danger')
    return
  }

  const n = json.data
  $('editTitle').value = n.title || ''
  $('editBody').value = n.body || ''
  $('editImage').value = n.image_url || ''
  $('editPublished').checked = n.published === true

  showMsg($('editMsg'), 'Ready', 'ok')
}

async function saveEdit() {
  const t = token()
  if (!t) return

  const id = $('editId').textContent.trim()
  const title = $('editTitle').value.trim()
  const body = $('editBody').value.trim()
  const image_url = $('editImage').value.trim()
  const published = $('editPublished').checked

  showMsg($('editMsg'), 'Saving...', 'muted')

  const { ok, json } = await fetchJSON(`${API}/admin-update-news`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify({ id, title, body, image_url: image_url || null, published })
  })

  if (!ok || !json?.ok) {
    showMsg($('editMsg'), 'Save failed', 'danger')
    return
  }

  showMsg($('editMsg'), 'Saved', 'ok')
  await refreshList()
  showEdit(false)
}

async function togglePublish(id, published) {
  const t = token()
  if (!t) return

  showMsg($('globalMsg'), published ? 'Publishing...' : 'Unpublishing...', 'muted')

  const { ok, json } = await fetchJSON(`${API}/admin-publish-news`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify({ id, published })
  })

  if (!ok || !json?.ok) {
    showMsg($('globalMsg'), 'Publish change failed', 'danger')
    return
  }

  showMsg($('globalMsg'), published ? 'Published' : 'Unpublished', 'ok')
  await refreshList()
}

async function deleteNews(id) {
  const t = token()
  if (!t) return

  if (!confirm('Delete this news post?')) return

  showMsg($('globalMsg'), 'Deleting...', 'muted')

  const { ok, json } = await fetchJSON(`${API}/admin-delete-news`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify({ id })
  })

  if (!ok || !json?.ok) {
    showMsg($('globalMsg'), 'Delete failed', 'danger')
    return
  }

  showMsg($('globalMsg'), 'Deleted', 'ok')
  await refreshList()
}

function logout() {
  clearToken()
  setTokenStatus('missing', 'danger')
  showApp(false)
}

/* ------------------ wiring ------------------ */

document.addEventListener('DOMContentLoaded', async () => {
  $('btnLogin').addEventListener('click', adminLogin)
  $('btnVerify').addEventListener('click', verifyToken)
  $('btnLogout').addEventListener('click', logout)

  $('btnCreate').addEventListener('click', createNews)
  $('btnRefresh').addEventListener('click', refreshList)
  $('btnSearch').addEventListener('click', searchNews)

  $('btnSave').addEventListener('click', saveEdit)
  $('btnCancelEdit').addEventListener('click', () => showEdit(false))

  // auto boot if token exists
  if (token()) {
    showApp(true)
    await verifyToken()
    await refreshList()
  } else {
    showApp(false)
  }
})
