import { getStore, setStore } from './_helpers.js'

export async function handler(event) {
  const { sponsorId } = JSON.parse(event.body)
  const sponsors = await getStore('sponsors')

  const sponsor = sponsors.find(s => s.id === sponsorId)
  if (sponsor) {
    sponsor.clicks = (sponsor.clicks || 0) + 1
    await setStore('sponsors', sponsors)
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
