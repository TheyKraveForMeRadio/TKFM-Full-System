import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type',
      'access-control-allow-methods': 'POST, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function getSiteUrl(event) {
  const envUrl =
    (process.env.SITE_URL && String(process.env.SITE_URL).trim()) ||
    (process.env.URL && String(process.env.URL).trim());

  if (envUrl) return envUrl.replace(/\/+$/, '');

  const origin =
    event?.headers?.origin ||
    event?.headers?.Origin ||
    (event?.headers?.referer
      ? String(event.headers.referer).split('/').slice(0, 3).join('/')
      : '');

  return String(origin || 'http://localhost:8888').replace(/\/+$/, '');
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const customer_id = String(body.customer_id || '').trim();

    if (!customer_id || !customer_id.startsWith('cus_')) {
      return json(400, { error: 'Missing or invalid customer_id', customer_id });
    }

    const siteUrl = getSiteUrl(event);
    const return_url = `${siteUrl}/account.html`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customer_id,
      return_url,
    });

    if (!session?.url) return json(500, { error: 'No portal url returned' });

    return json(200, { url: session.url });
  } catch (e) {
    return json(500, { error: 'Portal session error', detail: String(e?.message || e) });
  }
}
