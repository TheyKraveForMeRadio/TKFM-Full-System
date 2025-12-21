const API = '/.netlify/functions'
const DJ_TOKEN = 'tkfm_dj_token'

function djLogin() {
  fetch(`${API}/dj-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: djEmail.value,
      password: djPassword.value
    })
  })
  .then(r => r.json())
  .then(res => {
    if (!res.ok) {
      djError.textContent = res.error
      return
    }
    localStorage.setItem(DJ_TOKEN, res.token)
    showDashboard()
  })
}

function showDashboard() {
  document.getElementById('dj-login').classList.add('hidden')
  document.getElementById('dj-dashboard').classList.remove('hidden')
  loadMixtapes()
}

function logout() {
  localStorage.removeItem(DJ_TOKEN)
  location.reload()
}

function uploadMixtape() {
  const form = new FormData()
  form.append('title', mixTitle.value)
  form.append('cover', mixCover.files[0])
  form.append('audio', mixAudio.files[0])

  fetch(`${API}/dj-upload-mixtape`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem(DJ_TOKEN)}`
    },
    body: form
  })
  .then(r => r.json())
  .then(loadMixtapes)
}

function loadMixtapes() {
  fetch(`${API}/public-get-mixtapes`)
    .then(r => r.json())
    .then(res => {
      mixtapeList.innerHTML = res.data.map(m =>
        `<article>
          <h3>${m.title}</h3>
          <audio controls src="${m.audioUrl}"></audio>
          <button onclick="featureMixtape('${m.id}')">
            🔥 Feature This Mixtape
          </button>
        </article>`
      ).join('')
    })
}

function featureMixtape(mixtapeId) {
  fetch(`${API}/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem(DJ_TOKEN)}`
    },
    body: JSON.stringify({
      type: 'FEATURE_MIXTAPE',
      mixtapeId
    })
  })
  .then(r => r.json())
  .then(res => {
    if (res.url) window.location.href = res.url
  })
}
