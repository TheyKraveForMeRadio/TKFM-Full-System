import { getStore, setStore } from './_helpers.js';

export async function handler() {
  const mixtapes = await getStore('mixtapes');
  const now = Date.now();

  const featured = mixtapes
    .filter(m => m.featured && m.featureExpiresAt > now)
    .sort((a, b) => (b.featuredViews || 0) - (a.featuredViews || 0));

  const rewards = [
    { tier: 'elite', days: 7, badge: '🥇 #1 FEATURE' },
    { tier: 'pro', days: 5, badge: '🥈 TOP FEATURE' },
    { tier: 'basic', days: 3, badge: '🥉 TRENDING' }
  ];

  rewards.forEach((r, i) => {
    const m = featured[i];
    if (!m || m.leaderboardRewarded) return;

    m.featureTier = r.tier;
    m.featureExpiresAt = now + r.days * 86400000;
    m.leaderboardBadge = r.badge;
    m.leaderboardRewarded = true;
  });

  await setStore('mixtapes', mixtapes);
  return { statusCode: 200, body: 'Leaderboard rewards applied' };
}
