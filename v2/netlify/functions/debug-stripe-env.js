function mask(v) {
  v = String(v || '').trim();
  if (!v) return '(missing)';
  return v.slice(0, 7) + '…' + v.slice(-4);
}
function modeFromKey(k) {
  k = String(k || '').trim();
  if (k.startsWith('sk_live_')) return 'LIVE';
  if (k.startsWith('sk_test_')) return 'TEST';
  return 'UNKNOWN';
}

export async function handler() {
  const sk = process.env.STRIPE_SECRET_KEY || '';
  const starter = process.env.STRIPE_PRICE_MIXTAPE_HOSTING_STARTER || '';
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      stripe_secret_key: mask(sk),
      stripe_mode: modeFromKey(sk),
      price_mixtape_starter: mask(starter),
      netlify_dev: !!process.env.NETLIFY_DEV,
      node_env: process.env.NODE_ENV || null
    })
  };
}
