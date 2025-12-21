let sponsorIndex = 0;
let sponsors = [];
const INTERVAL = 7000;

async function loadSponsors() {
  const res = await fetch('/.netlify/functions/public-get-sponsors');
  sponsors = await res.json();

  if (!sponsors.length) return;

  renderSponsor();
  setInterval(nextSponsor, INTERVAL);
}

function nextSponsor() {
  sponsorIndex = (sponsorIndex + 1) % sponsors.length;
  renderSponsor();
}

function renderSponsor() {
  const box = document.getElementById('tkfm-sponsor-slot');
  if (!box) return;

  const s = sponsors[sponsorIndex];

  box.innerHTML = `
    <a href="${s.link}" target="_blank" class="sponsor-card">
      <img src="${s.image}" alt="${s.name}" />
      <div class="sponsor-label">Sponsored</div>
    </a>
  `;

  fetch('/.netlify/functions/track-sponsor-view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sponsorId: s.id })
  });
}

document.addEventListener('DOMContentLoaded', loadSponsors);
