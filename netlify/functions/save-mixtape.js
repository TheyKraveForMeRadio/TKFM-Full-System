import { v4 as uuidv4 } from 'uuid'
import { getStore, setStore } from './_helpers.js'

export async function handler(event) {
  const body = JSON.parse(event.body)
  const store = await getStore('mixtapes')

  const mixtape = {
    id: uuidv4(),
    title: body.title,
    djName: body.djName,
    audioUrl: body.audioUrl,
    createdAt: Date.now(),

    featured: false,
    featureTier: null,
    featureExpiresAt: null,
    featuredViews: 0,
    homepagePin: false
  }

  store.unshift(mixtape)
  await setStore('mixtapes', store)

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
