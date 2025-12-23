// netlify/functions/public-get-promo-script.js — ENTERPRISE LOCKED (PUBLIC)
function json(statusCode, obj) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60', // short cache is fine
    },
    body: JSON.stringify(obj),
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, body: '' }
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' })

  const script =
    'Yo this is TKFM — Independent Artist Power Station.\n' +
    'Up next… an ELITE featured mixtape.\n'

  return json(200, { ok: true, script })
}
