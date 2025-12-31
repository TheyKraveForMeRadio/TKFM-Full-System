// netlify/functions/label-contract-get.js
// Returns a single contract by id from the "contracts" store

import { getStore } from './_helpers.js'

export async function handler(event) {
  try {
    const id = event.queryStringParameters?.id
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'missing-id' })
      }
    }

    const contracts = (await getStore('contracts')) || []
    const contract = contracts.find(c => c.id === id)

    if (!contract) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'not-found' })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify(contract)
    }
  } catch (err) {
    console.error('label-contract-get error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
