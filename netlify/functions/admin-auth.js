export async function handler(event) {
  // Method lock
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, body: '' }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    }
  }

  const header =
    event.headers?.authorization ||
    event.headers?.Authorization ||
    ''

  // Support: "Bearer <token>" OR raw token
  const token = header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : header.trim()

  if (
    !process.env.ADMIN_TOKEN ||
    !token ||
    token !== process.env.ADMIN_TOKEN
  ) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' }),
    }
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'admin-ok' }),
  }
}
