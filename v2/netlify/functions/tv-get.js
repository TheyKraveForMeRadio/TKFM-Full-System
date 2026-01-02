import { getStore } from './_helpers.js';

export async function handler() {
  const cfg = (await getStore('tv_config')) || {};
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pinnedId: cfg.pinnedId || '',
      rotateSeconds: cfg.rotateSeconds || 120
    })
  };
}
