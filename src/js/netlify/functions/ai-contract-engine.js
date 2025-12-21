import { getStore, setStore } from './_helpers.js'

export async function handler() {
  const mixtapes = await getStore('mixtapes')
  const contracts = await getStore('contracts') || []
  const now = Date.now()

  mixtapes.forEach(m => {
    if (
      m.viralScore >= 150 &&
      m.featureTier === 'elite' &&
      !m.contractOffered
    ) {
      const offer = {
        id: `CTR-${m.id}`,
        mixtapeId: m.id,
        dj: m.djName,
        revenueSplit: '70/30',
        exclusivityDays: 30,
        offeredAt: now,
        signed: false
      }

      contracts.push(offer)
      m.contractOffered = true
    }
  })

  await setStore('contracts', contracts)
  await setStore('mixtapes', mixtapes)

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  }
}
