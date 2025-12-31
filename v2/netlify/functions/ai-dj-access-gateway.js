// netlify/functions/ai-dj-access-gateway.js
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

    // Allowed roles for AI DJ Engine
    const allowedRoles = ['owner', 'dj_elite', 'label_enterprise']

    if (!allowedRoles.includes(user.role)) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          access: 'denied',
          reason: 'upgrade-required',
          role: user.role || 'unknown'
        })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        access: 'granted',
        role: user.role
      })
    }
  } catch (err) {
    console.error('ai-dj-access-gateway error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ access: 'error', reason: 'server-error' })
    }
  }
}
