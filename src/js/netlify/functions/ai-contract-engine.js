import { getStore, setStore } from "./_helpers.js"

export async function handler(event) {
  // 🔒 INTERNAL-ONLY PROTECTION
  if (event.headers["x-tkfm-internal-key"] !== process.env.INTERNAL_CRON_KEY) {
    return { statusCode: 403, body: "Forbidden" }
  }

  const mixtapes = await getStore("mixtapes") || []
  const contracts = await getStore("contracts") || []
  const now = Date.now()

  const existingContractIds = new Set(contracts.map(c => c.id))

  mixtapes.forEach(m => {
    if (
      typeof m.viralScore !== "number" ||
      m.viralScore < 150 ||
      m.featureTier !== "elite" ||
      m.contractOffered === true
    ) return

    if (!m.id || !m.djName) return

    const contractId = `CTR-${m.id}`

    if (existingContractIds.has(contractId)) {
      m.contractOffered = true
      return
    }

    const offer = {
      id: contractId,
      mixtapeId: m.id,
      dj: m.djName,
      revenueSplit: "70/30",
      exclusivityDays: 30,
      offeredAt: now,
      signed: false,
      status: "pending"
    }

    contracts.push(offer)
    m.contractOffered = true
  })

  await setStore("contracts", contracts)
  await setStore("mixtapes", mixtapes)

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      contractsGenerated: contracts.length
    })
  }
}
