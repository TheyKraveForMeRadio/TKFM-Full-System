import { getStore, setStore } from './_helpers.js'

export async function handler(event) {
  const { contractId } = JSON.parse(event.body)
  const contracts = await getStore('contracts')

  const contract = contracts.find(c => c.id === contractId)
  if (!contract) {
    return { statusCode: 404, body: 'Not found' }
  }

  contract.signed = true
  contract.signedAt = Date.now()

  await setStore('contracts', contracts)

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, contract })
  }
}
