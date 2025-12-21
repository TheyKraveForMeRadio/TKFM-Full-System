import { verifyDJ, getStore, setStore } from './_helpers.js';

const TIERS = {
  basic: {
    days: 7,
    weight: 1,
    label: '🔥 FEATURED'
  },
  pro: {
    days: 14,
    weight: 2,
    label: '💎 PRO FEATURE'
  },
  elite: {
    days: 30,
    weight: 3,
    label: '👑 ELITE FEATURE'
  }
};

export async function handler(event) {
  try {
    const user = verifyDJ(event);
    const { mixtapeId, tier } = JSON.parse(event.body);

    if (!TIERS[tier]) {
      return { statusCode: 400, body: 'Invalid tier' };
    }

    const store = await getStore('mixtapes');
    const mixtapes = store || [];

    const idx = mixtapes.findIndex(
      m => m.id === mixtapeId && m.djId === user.id
    );

    if (idx === -1) {
      return { statusCode: 404, body: 'Mixtape not found' };
    }

    const now = Date.now();
    const expires =
      now + TIERS[tier].days * 24 * 60 * 60 * 1000;

    mixtapes[idx].featured = true;
    mixtapes[idx].featureTier = tier;
    mixtapes[idx].featureWeight = TIERS[tier].weight;
    mixtapes[idx].featureLabel = TIERS[tier].label;
    mixtapes[idx].featuredUntil = expires;

    await setStore('mixtapes', mixtapes);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    return { statusCode: 401, body: err.message };
  }
}
