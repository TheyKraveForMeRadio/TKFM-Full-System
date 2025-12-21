let index = 0
const INTERVAL = 6000

async function loadSponsors() {
  const res = await fetch('/.netlify/functions/public-get-sponsors')
  const sponsors = await res.json()

  if (!sponsors.length) return

  const box = document.getElementById('sponsor-rotation')

  setInterval(() => {
    const s = sponsors[index % sponsors.length]
    index++

    box.innerHTML = `
      <div class="sponsor-card">
        <div class="badge">OFFICIAL PARTNER</div>
        <img src="${s.logoUrl}" alt="${s.brandName}" />
        <h4>${s.brandName}</h4>
      </div>
    `

    fetch('/.netlify/functions/track-sponsor-impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sponsorId: s.id })
    })
  }, INTERVAL)
}

document.addEventListener('DOMContentLoaded', loadSponsors)
