import { getStore } from './_helpers.js';

export async function handler() {
  try {
    const store = await getStore('mixtapes');
    const mixtapes = store || [];

    const tierWeight = {
      elite: 3,
      pro: 2,
      basic: 1
    };

    const now = Date.now();

    const leaderboard = mixtapes
      .filter(m => m.featured && m.featureExpiresAt > now)
      .map(m => ({
        id: m.id,
        title: m.title,
        djName: m.djName,
        audioUrl: m.audioUrl,
        tier: m.featureTier,
        views: m.featuredViews || 0,
        score: (m.featuredViews || 0) * (tierWeight[m.featureTier] || 1)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // TOP 10

    return {
      statusCode: 200,
      body: JSON.stringify(leaderboard)
    };

  } catch (err) {
    console.error('Leaderboard error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Leaderboard failed' })
    };
  }
}
