import { getStore } from './_helpers.js';

export async function handler() {
  try {
    const mixtapes = await getStore('mixtapes') || [];
    const now = Date.now();

    const pinned = mixtapes.filter(m =>
      m.homepagePin &&
      m.featured &&
      m.featureExpiresAt > now
    );

    const rest = mixtapes.filter(m =>
      !m.homepagePin &&
      (!m.featured || m.featureExpiresAt <= now)
    );

    return {
      statusCode: 200,
      body: JSON.stringify([
        ...pinned,
        ...rest
      ])
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load mixtapes' })
    };
  }
}
