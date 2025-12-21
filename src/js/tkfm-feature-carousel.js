let i = 0
setInterval(async () => {
  const res = await fetch('/.netlify/functions/public-get-mixtapes')
  const data = await res.json()
  const featured = data.filter(m => m.featured && m.featureExpiresAt > Date.now())
  if (!featured.length) return

  const m = featured[i % featured.length]
  document.getElementById('featured-carousel').innerHTML = `
    <div class="mixtape-card featured tier-${m.featureTier}">
      <strong>${m.title}</strong>
      <audio controls src="${m.audioUrl}" style="width:100%"></audio>
    </div>`
  fetch('/.netlify/functions/track-feature-view', {
    method: 'POST',
    body: JSON.stringify({ mixtapeId: m.id })
  })
  i++
}, 5000)
