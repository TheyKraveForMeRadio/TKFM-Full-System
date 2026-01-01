// Minimal Supabase REST helper (no extra deps)
// Uses PostgREST: {SUPABASE_URL}/rest/v1/{table}
function mustEnv(name) {
  return String(process.env[name] || '').trim();
}

export function supabaseEnabled() {
  const url = mustEnv('SUPABASE_URL');
  const key = mustEnv('SUPABASE_SERVICE_ROLE_KEY');
  return !!(url && key);
}

function base() {
  const url = mustEnv('SUPABASE_URL').replace(/\/+$/, '');
  const key = mustEnv('SUPABASE_SERVICE_ROLE_KEY');
  return { url, key };
}

function headersJson() {
  const { key } = base();
  return {
    'content-type': 'application/json',
    'apikey': key,
    'authorization': `Bearer ${key}`
  };
}

export async function sbInsert(table, row) {
  const { url } = base();
  const res = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: { ...headersJson(), 'prefer': 'return=representation' },
    body: JSON.stringify(row)
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) {}

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) ? (data.message || data.error) : text;
    throw new Error(`sb_insert_failed:${res.status}:${msg}`);
  }

  // Supabase returns an array for return=representation
  return Array.isArray(data) ? data[0] : data;
}

export async function sbSelect(table, queryString) {
  const { url } = base();
  const qs = queryString ? (queryString.startsWith('?') ? queryString : `?${queryString}`) : '';
  const res = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}${qs}`, {
    method: 'GET',
    headers: headersJson()
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) {}

  if (!res.ok) {
    const msg = (data && (data.message || data.error)) ? (data.message || data.error) : text;
    throw new Error(`sb_select_failed:${res.status}:${msg}`);
  }

  return data;
}
