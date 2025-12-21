import { getStore } from './_helpers.js'

export async function handler() {
  try {
    const sponsors = await getStore('sponsors')

    if (!sponsors || sponsors.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify(null)
      }
    }

    const pick =
      sponsors[Math.floor(Math.random() * sponsors.length)]

    return {
      statusCode: 200,
      body: JSON.stringify(pick)
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Sponsor rotation failed' })
    }
  }
}
