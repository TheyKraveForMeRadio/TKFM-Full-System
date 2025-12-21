import { getStore, setStore } from './_helpers.js';

const PROMOTION_RULES = {
  basic: { views: 100, next: 'pro', extendDays: 7 },
  pro: { views: 300, next: 'elite', extendDays: 14 }
};

export async function handler() {
  const store = (await getStore('mixtapes')) || [];
  const now = Date.now();

  let changed = false;

  for (const mixtape of store) {
    if (!mixtape.featured) continue;
    if (mixtape.featureExpiresAt < now) continue;

    const rule = PROMOTION_RULES[mixtape.featureTier];
    if (!rule) continue;

    if ((mixtape.featuredViews || 0) >= rule.views) {
      mixtape.featureTier = rule.next;
      mixtape.featureExpiresAt =
        now + rule.extendDays * 24 * 60 * 60 * 1000;

      changed = true;
    }
  }

  if (changed) {
    await setStore('mixtapes', store);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      updated: changed
    })
  };
}
