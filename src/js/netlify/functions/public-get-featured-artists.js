import { getStore } from './_helpers.js'

export async function handler() {
  const artists = await getStore('artists')
  const now = Date.now()

  const featured = artists.filter(a =>
    a.featured && a.spotlightExpiresAt > now
  )

  return {
    statusCode: 200,
    body: JSON.stringify(featured)
  }
}
