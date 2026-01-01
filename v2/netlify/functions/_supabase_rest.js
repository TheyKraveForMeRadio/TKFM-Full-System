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

async function parse(res) {
  const text = await res.text().catch(() => '');
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) {}
  if (!res.ok) {
    const msg = (data && (data.message || data.error)) ? (data.message || data.error) : text;
    throw new Error(`supabase_failed:${res.status}:${msg}`);
  }
  return data;
}

export async function sbInsert(table, row) {
  const { url } = base();
  const res = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}`, {
    method: 'POST',
    headers: { ...headersJson(), 'prefer': 'return=representation' },
    body: JSON.stringify(row)
  });
  const data = await parse(res);
  return Array.isArray(data) ? data[0] : data;
}

// Upsert via PostgREST (resolution=merge-duplicates)
export async function sbUpsert(table, row, onConflictColumn) {
  const { url } = base();
  const onc = String(onConflictColumn || '').trim();
  const qs = onc ? `?on_conflict=${encodeURIComponent(onc)}` : '';
  const res = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}${qs}`, {
    method: 'POST',
    headers: {
      ...headersJson(),
      'prefer': 'return=representation,resolution=merge-duplicates'
    },
    body: JSON.stringify(row)
  });
  const data = await parse(res);
  return Array.isArray(data) ? data[0] : data;
}

export async function sbSelect(table, queryString) {
  const { url } = base();
  const qs = queryString ? (queryString.startsWith('?') ? queryString : `?${queryString}`) : '';
  const res = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}${qs}`, {
    method: 'GET',
    headers: headersJson()
  });
  return await parse(res);
}

export async function sbPatch(table, queryString, patchObj) {
  const { url } = base();
  const qs = queryString ? (queryString.startsWith('?') ? queryString : `?${queryString}`) : '';
  const res = await fetch(`${url}/rest/v1/${encodeURIComponent(table)}${qs}`, {
    method: 'PATCH',
    headers: { ...headersJson(), 'prefer': 'return=representation' },
    body: JSON.stringify(patchObj)
  });
  const data = await parse(res);
  return Array.isArray(data) ? data[0] : data;
}
