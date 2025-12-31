// netlify/functions/label-contract-save.js
// Saves a label contract into the local JSON store "contracts"

import { getStore, setStore } from './_helpers.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const data = JSON.parse(event.body || '{}')

    const {
      labelName,
      labelRepName,
      artistName,
      artistLegalName,
      projectTitle,
      termMonths,
      territory,
      masterSplit,
      pubSplit,
      advanceAmount,
      effectiveDate,
      contractText
    } = data

    if (!labelName || !artistName || !contractText) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      }
    }

    const contracts = (await getStore('contracts')) || []

    const id = Date.now().toString() + '-' + Math.random().toString(36).slice(2, 8)

    const record = {
      id,
      createdAt: new Date().toISOString(),
      labelName,
      labelRepName,
      artistName,
      artistLegalName,
      projectTitle,
      termMonths,
      territory,
      masterSplit,
      pubSplit,
      advanceAmount,
      effectiveDate,
      contractText
    }

    contracts.push(record)
    await setStore('contracts', contracts)

    return {
      statusCode: 200,
      body: JSON.stringify({ id })
    }
  } catch (err) {
    console.error('label-contract-save error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
