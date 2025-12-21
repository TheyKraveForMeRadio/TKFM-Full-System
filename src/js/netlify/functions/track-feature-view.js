import { getStore, setStore } from './_helpers.js'

export async function handler(event) {
  const { mixtapeId } = JSON.parse(event.body)
  const store = await getStore('mixtapes')

  const mix = store.find(m => m.id === mixtapeId)
  if (!mix) return { statusCode: 404 }

  mix.featuredViews = (mix.featuredViews || 0) + 1
  await setStore('mixtapes', store)

  return { statusCode: 200 }
}
