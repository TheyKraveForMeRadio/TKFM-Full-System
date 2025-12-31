// netlify/functions/autopilot-access-gateway.js
// Gatekeeper for Autopilot Monetization console

import { getStore } from './_helpers.js'

export async function handler(event) {
  try {
    const userId = event.queryStringParameters?.userId
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ access: 'denied', reason: 'no-user' })
      }
    }

    const users = (await getStore('users')) || []
    const user = users.find(u => u.id === userId)

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ access: 'denied', reason: 'not-found' })
      }
    }

    // Roles allowed to see Autopilot Monetization
    const allowedRoles = [
      'owner',
      'dj_elite',
      'dj_basic',
      'artist_elite',
      'label_basic',
      'label_enterprise'
    ]

    const role = user.role || 'free'

    if (!allowedRoles.includes(role)) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          access: 'denied',
          reason: 'upgrade-required',
          role
        })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        access: 'granted',
        role
      })
    }
  } catch (err) {
    console.error('autopilot-access-gateway error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        access: 'error',
        reason: 'server-error'
      })
    }
  }
}
