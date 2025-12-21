document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('mixtapes');
  if (!container) return;

  const res = await fetch('/.netlify/functions/public-get-mixtapes');
  const mixtapes = await res.json();

  // FEATURED FIRST
  mixtapes.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });

  container.innerHTML = mixtapes.map(m => {
    const featuredActive =
      m.featured && m.featuredUntil && Date.now() < m.featuredUntil;

    return `
      <div class="mixtape-card ${featuredActive ? 'featured' : ''}">
        ${featuredActive ? `<div class="badge">🔥 FEATURED</div>` : ''}

        <h3>${m.title}</h3>
        <p>${m.artist || ''}</p>

        ${featuredActive ? `
          <p class="countdown"
             data-expire="${m.featuredUntil}">
            ⏳ Loading countdown…
          </p>
        ` : ''}

        <audio controls src="${m.audioUrl}"></audio>
      </div>
    `;
  }).join('');

  startCountdowns();
});

function startCountdowns() {
  const timers = document.querySelectorAll('.countdown');

  setInterval(() => {
    timers.forEach(el => {
      const expire = Number(el.dataset.expire);
      const diff = expire - Date.now();

      if (diff <= 0) {
        el.textContent = '⏳ Feature expired';
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hrs = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);

      el.textContent = `⏳ ${days}d ${hrs}h ${mins}m left`;
    });
  }, 60000);
}
