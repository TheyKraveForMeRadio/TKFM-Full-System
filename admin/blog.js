// admin/blog.js — ENTERPRISE LOCKED BLOG UI
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

async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, opts)
  const text = await res.text()
  let json = null
  try { json = text ? JSON.parse(text) : null } catch {}
  return { ok: res.ok, status: res.status, json }
}

function setMsg(text, cls = 'muted') {
  $('msg').textContent = text || ''
  $('msg').className = cls
}

function editingId() {
  return $('editId').textContent === 'new' ? '' : $('editId').textContent
}

function setEditingId(id) {
  $('editId').textContent = id || 'new'
}

function getPayload() {
  return {
    id: editingId() || undefined,
    title: $('title').value.trim(),
    slug: $('slug').value.trim() || null,
    excerpt: $('excerpt').value.trim() || null,
    cover_url: $('cover_url').value.trim() || null,
    body: $('body').value.trim(),
    status: $('published').checked ? 'published' : 'draft',
  }
}

function clearForm() {
  setEditingId('')
  $('title').value = ''
  $('slug').value = ''
  $('excerpt').value = ''
  $('cover_url').value = ''
  $('body').value = ''
  $('published').checked = false
}

async function refreshList() {
  const t = token()
  if (!t) return setMsg('Missing admin token — login first', 'danger')

  const status = $('status').value
  const url = `${API}/admin-list-blog?limit=50&offset=0&status=${encodeURIComponent(status)}`

  const { ok, json } = await fetchJSON(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${t}` },
  })

  if (!ok || !json?.ok) return setMsg('Load failed', 'danger')
  renderList(json.data || [])
  setMsg('Loaded', 'ok')
}

async function search() {
  const t = token()
  if (!t) return setMsg('Missing admin token — login first', 'danger')

  const q = $('q').value.trim()
  const status = $('status').value

  if (!q) return refreshList()

  const url = `${API}/admin-search-blog?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&limit=50`
  const { ok, json } = await fetchJSON(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${t}` },
  })

  if (!ok || !json?.ok) return setMsg('Search failed', 'danger')
  renderList(json.data || [])
  setMsg(`Found ${(json.data || []).length}`, 'ok')
}

function renderList(items) {
  $('count').textContent = String(items.length)

  if (!items.length) {
    $('list').innerHTML = `<p class="muted">No results.</p>`
    return
  }

  $('list').innerHTML = items.map(p => {
    const id = escapeHTML(p.id || '')
    const title = escapeHTML(p.title || 'Untitled')
    const slug = escapeHTML(p.slug || '')
    const author = escapeHTML(p.author || '')
    const created = safeDate(p.created_at)
    const pub = (p.status === 'published')

    return `
      <article>
        <h3>${title}</h3>
        <div class="meta">
          ${pub ? '<span class="badge ok">PUBLISHED</span>' : '<span class="badge warn">DRAFT</span>'}
          ${slug ? ` • /${slug}` : ''}
          ${author ? ` • ${author}` : ''}
          ${created ? ` • ${created}` : ''}
        </div>
        <div class="toolbar" style="margin-top:10px">
          <button data-open="${id}">Open</button>
          <button data-toggle="${id}" data-pub="${pub ? '1' : '0'}">${pub ? 'Unpublish' : 'Publish'}</button>
        </div>
      </article>
    `
  }).join('')

  $('list').querySelectorAll('button[data-open]').forEach(btn => {
    btn.addEventListener('click', () => openPost(btn.getAttribute('data-open')))
  })

  $('list').querySelectorAll('button[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => togglePublish(btn.getAttribute('data-toggle'), btn.getAttribute('data-pub') !== '1'))
  })
}

async function openPost(id) {
  const t = token()
  if (!t) return setMsg('Missing admin token — login first', 'danger')

  setMsg('Loading...', 'muted')

  const url = `${API}/admin-get-blog-by-id?id=${encodeURIComponent(id)}`
  const { ok, json } = await fetchJSON(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${t}` },
  })

  if (!ok || !json?.ok || !json?.data) return setMsg('Not found', 'danger')

  const p = json.data
  setEditingId(p.id)
  $('title').value = p.title || ''
  $('slug').value = p.slug || ''
  $('excerpt').value = p.excerpt || ''
  $('cover_url').value = p.cover_url || ''
  $('body').value = p.body || ''
  $('published').checked = (p.status === 'published')

  setMsg('Ready', 'ok')
}

async function save() {
  const t = token()
  if (!t) return setMsg('Missing admin token — login first', 'danger')

  setMsg('Saving...', 'muted')

  const p = getPayload()

  if (!p.title || p.title.length < 3) return setMsg('Title too short', 'danger')
  if (!p.body || p.body.length < 20) return setMsg('Body too short', 'danger')

  // create vs update
  if (!editingId()) {
    const { ok, json } = await fetchJSON(`${API}/admin-create-blog`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ ...p, published: p.status === 'published' }),
    })

    if (!ok || !json?.ok) return setMsg('Create failed', 'danger')
    setMsg('Created', 'ok')
    clearForm()
    return refreshList()
  }

  const { ok, json } = await fetchJSON(`${API}/admin-update-blog`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify(p),
  })

  if (!ok || !json?.ok) return setMsg('Update failed', 'danger')
  setMsg('Saved', 'ok')
  return refreshList()
}

async function del() {
  const t = token()
  if (!t) return setMsg('Missing admin token — login first', 'danger')

  const id = editingId()
  if (!id) return setMsg('Nothing selected', 'danger')
  if (!confirm('Delete this blog post?')) return

  setMsg('Deleting...', 'muted')

  const { ok, json } = await fetchJSON(`${API}/admin-delete-blog`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify({ id }),
  })

  if (!ok || !json?.ok) return setMsg('Delete failed', 'danger')
  setMsg('Deleted', 'ok')
  clearForm()
  return refreshList()
}

async function togglePublish(id, publish) {
  const t = token()
  if (!t) return setMsg('Missing admin token — login first', 'danger')

  setMsg(publish ? 'Publishing...' : 'Unpublishing...', 'muted')

  const { ok, json } = await fetchJSON(`${API}/admin-publish-blog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify({ id, published: publish }),
  })

  if (!ok || !json?.ok) return setMsg('Publish toggle failed', 'danger')
  setMsg('Updated', 'ok')
  return refreshList()
}

document.addEventListener('DOMContentLoaded', async () => {
  $('btnNew').addEventListener('click', () => { clearForm(); setMsg('New post', 'muted') })
  $('btnSave').addEventListener('click', save)
  $('btnDelete').addEventListener('click', del)
  $('btnRefresh').addEventListener('click', refreshList)
  $('btnSearch').addEventListener('click', search)

  if (!token()) setMsg('Missing admin token — login via /admin/index.html first', 'warn')
  else await refreshList()
})
