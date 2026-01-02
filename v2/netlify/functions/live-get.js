import { getStore, setStore } from './_helpers.js';

export async function handler() {
  const active = (await getStore('live_active')) || null;

  if (active && active.endsAt && Date.now() > active.endsAt) {
    // auto-expire
    await setStore('live_active', null);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: null })
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: active || null })
  };
}
