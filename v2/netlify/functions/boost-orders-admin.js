import { getStore } from './_helpers.js';

function unauthorized(expectedSha, providedSha) {
  return {
    statusCode: 401,
    body: JSON.stringify({
      ok:false,
      error:'Unauthorized',
      expected_sha: expectedSha,
      provided_sha: providedSha,
      fix:'Your local key does NOT match Netlify env TKFM_OWNER_KEY. Make them the same.'
    })
  };
}

function sha12(s) {
  try {
    // crypto is available in node runtime
    const crypto = require('crypto'); // works even under ESM via require? In ESM, require isn't defined.
    return crypto.createHash('sha256').update(String(s || '')).digest('hex').slice(0, 12);
  } catch (e) {
    // ESM-safe: use global crypto if available (node >=19)
    try {
      const h = globalThis.crypto?.subtle;
      return (s ? String(s).slice(0,12) : '');
    } catch (e2) {
      return (s ? String(s).slice(0,12) : '');
    }
  }
}

// ESM-safe sha via dynamic import
async function sha12ESM(s) {
  const str = String(s || '');
  try {
    const { createHash } = await import('node:crypto');
    return createHash('sha256').update(str).digest('hex').slice(0, 12);
  } catch (e) {
    return str.slice(0, 12);
  }
}

/**
 * TKFM: Owner-only stats for Boost orders
 * GET or POST
 * Header: x-tkfm-owner-key
 */
export async function handler(event) {
  const provided = (event.headers && (event.headers['x-tkfm-owner-key'] || event.headers['X-TKFM-OWNER-KEY'])) || '';
  const expected = process.env.TKFM_OWNER_KEY || '';

  const expectedSha = await sha12ESM(expected);
  const providedSha = await sha12ESM(provided);

  if (!expected || !provided || provided !== expected) {
    return unauthorized(expectedSha, providedSha);
  }

  const store = (await getStore('boost_orders')) || [];
  const now = Date.now();

  const byLookup = {};
  let totalRevenue = 0;
  let totalCount = 0;

  for (const o of store) {
    if (!o) continue;
    totalCount++;
    const amt = Number(o.amount_total || 0);
    totalRevenue += isFinite(amt) ? amt : 0;
    const k = o.lookup || 'unknown';
    byLookup[k] = byLookup[k] || { count: 0, revenue: 0 };
    byLookup[k].count += 1;
    byLookup[k].revenue += isFinite(amt) ? amt : 0;
  }

  // last 30 days
  const days30 = now - (30 * 24 * 60 * 60 * 1000);
  const last30 = store.filter(o => o && (o.created_at || 0) >= days30);

  // Keep only recent 100 for display
  const recent = store.slice(0, 100);

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok:true,
      total_count: totalCount,
      total_amount: totalRevenue,
      currency: 'usd',
      by_lookup: byLookup,
      last30_count: last30.length,
      recent,
    })
  };
}
