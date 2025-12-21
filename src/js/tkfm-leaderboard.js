document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('/.netlify/functions/public-get-mixtapes')
  const data = await res.json()

  const ranked = data
    .filter(m => m.featured)
    .sort((a, b) => (b.featuredViews || 0) - (a.featuredViews || 0))
    .slice(0, 10)

  const box = document.getElementById('tkfm-leaderboard')
  if (!box) return

  box.innerHTML = ranked.map((m, i) => `
    <div class="mixtape-card tier-${m.featureTier}">
      <strong>#${i + 1} ${m.title}</strong><br/>
      👁 ${(m.featuredViews || 0).toLocaleString()} views<br/>
      🏷 ${m.featureTier.toUpperCase()}
    </div>
  `).join('')
})

fetch('/.netlify/functions/feature-revenue-engine')
.then(r=>r.json())
.then(data=>{
  document.getElementById('tkfm-leaderboard').innerHTML =
    data.map(m=>`
      <div class="mixtape-card">
        🏆 #${m.rank} — ${m.title}<br/>
        👁 ${m.featuredViews} views
      </div>
    `).join('')
})
