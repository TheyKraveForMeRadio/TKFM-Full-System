async function loadSponsorStats() {
  const res = await fetch('/.netlify/functions/public-get-sponsors')
  const data = await res.json()

  const box = document.getElementById('sponsor-stats')
  if (!box) return

  box.innerHTML = data.map(s => `
    <div class="mixtape-card">
      <strong>${s.name}</strong><br/>
      👁 Views: ${s.views || 0}<br/>
      ⏱ Expires: ${new Date(s.expiresAt).toLocaleDateString()}
    </div>
  `).join('')
}

document.addEventListener('DOMContentLoaded', loadSponsorStats)
