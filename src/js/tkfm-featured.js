// 🔥 TKFM FEATURED MIXTAPES ENGINE (LOCKED)

/**
 * Fetches featured mixtapes from backend
 * Auto-filters expired features server-side
 * Safe if API returns empty data
 */
export async function loadFeaturedMixtapes() {
  const container = document.getElementById('featuredList');
  if (!container) return;

  try {
    const res = await fetch('/.netlify/functions/public-get-mixtapes');
    const json = await res.json();

    if (!json?.data || json.data.length === 0) {
      container.innerHTML = `<p>No featured mixtapes right now.</p>`;
      return;
    }

    container.innerHTML = json.data
      .filter(m => m.featured === true)
      .map(m => `
        <article class="mixtape-card">
          <h3>${m.title}</h3>
          <p>by ${m.artist}</p>
          ${m.coverUrl ? `<img src="${m.coverUrl}" alt="${m.title}" />` : ''}
          ${m.audioUrl ? `<audio controls src="${m.audioUrl}"></audio>` : ''}
        </article>
      `)
      .join('');
  } catch (err) {
    console.error('Featured mixtapes error:', err);
    container.innerHTML = `<p>Error loading featured mixtapes.</p>`;
  }
}
