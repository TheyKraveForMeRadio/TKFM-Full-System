async function loadHomepageAI() {
  const res = await fetch('/.netlify/functions/public-get-mixtapes')
  const data = await res.json()

  const king = data.find(m => m.homepagePin)
  const runners = data
    .filter(m => m.featured && !m.homepagePin)
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 4)

  const box = document.getElementById('featured-mixtapes')
  if (!box) return

  box.innerHTML = `
    ${king ? `
      <div class="mixtape-card tier-elite featured">
        <div class="badge">👑 AI #1 PICK</div>
        <h2>${king.title}</h2>
        <p>🎧 DJ: ${king.djName}</p>
        <audio controls src="${king.audioUrl}" style="width:100%"></audio>
        <p>🔥 Score: ${king.aiScore}</p>
      </div>
    ` : ''}

    ${runners.map(m => `
      <div class="mixtape-card tier-${m.featureTier}">
        <div class="badge">🔥 TRENDING</div>
        <strong>${m.title}</strong><br/>
        Score: ${m.aiScore}
      </div>
    `).join('')}
  `
}

document.addEventListener('DOMContentLoaded', loadHomepageAI)
