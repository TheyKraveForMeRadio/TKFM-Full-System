async function loadFeaturedArtist() {
  const res = await fetch('/.netlify/functions/public-get-featured-artists')
  const data = await res.json()

  const box = document.getElementById('featured-artist')
  if (!box || !data.length) return

  const artist = data[0]

  box.innerHTML = `
    <div class="mixtape-card tier-elite featured">
      <div class="badge">👑 FEATURED ARTIST</div>
      <h2>${artist.name}</h2>
      <p>🔥 Total Views: ${artist.totalViews.toLocaleString()}</p>
      <p>⏱ Spotlight Active</p>
    </div>
  `
}

document.addEventListener('DOMContentLoaded', loadFeaturedArtist)
