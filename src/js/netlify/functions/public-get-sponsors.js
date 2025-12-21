import { getStore } from './_helpers.js'

export async function handler() {
  const sponsors = await getStore('sponsors')

  return {
    statusCode: 200,
    body: JSON.stringify(
      sponsors.filter(s => s.active)
    )
  }
}
