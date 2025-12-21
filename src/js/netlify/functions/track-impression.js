import { getStore, setStore } from './_helpers.js'

export async function handler(event) {
  const { type, id } = JSON.parse(event.body)
  const storeName = type === 'sponsor' ? 'sponsors' : 'mixtapes'
  const store = await getStore(storeName)

  const item = store.find(x => x.id === id)
  if (item) {
    item.impressions = (item.impressions || 0) + 1
    item.lastSeenAt = Date.now()
    await setStore(storeName, store)
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
