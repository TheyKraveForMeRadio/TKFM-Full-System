import { getStore, setStore } from './_helpers.js'

export async function handler() {
  const stats = await getStore('stats') || { eliteSold: 0 }

  if (stats.eliteSold >= 3 && !stats.priceRaised) {
    stats.elitePrice = 150
    stats.priceRaised = true
  }

  await setStore('stats', stats)

  return { statusCode: 200, body: 'pricing-ok' }
}
