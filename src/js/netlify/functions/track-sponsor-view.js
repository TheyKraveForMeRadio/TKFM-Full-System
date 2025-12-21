import { getStore, setStore } from './_helpers.js';

export async function handler(event) {
  const { sponsorId } = JSON.parse(event.body);

  const sponsors = await getStore('sponsors');
  const s = sponsors.find(x => x.id === sponsorId);

  if (s) {
    s.views = (s.views || 0) + 1;
    await setStore('sponsors', sponsors);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  };
}
