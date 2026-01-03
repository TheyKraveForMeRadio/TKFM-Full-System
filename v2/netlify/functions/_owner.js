// Server-side Owner Guard for Netlify Functions
// Auth methods supported:
// 1) Header: x-tkfm-owner-key: <TKFM_OWNER_KEY>
// 2) Header: authorization: Bearer <TKFM_OWNER_KEY>
//
// Env keys checked (first match wins):
// - TKFM_OWNER_KEY
// - OWNER_KEY
// - INTERNAL_OWNER_KEY

function getEnvKey(){
  return String(process.env.TKFM_OWNER_KEY || process.env.OWNER_KEY || process.env.INTERNAL_OWNER_KEY || '').trim();
}

function readHeader(headers, name){
  if (!headers) return '';
  const k = Object.keys(headers).find(x => String(x).toLowerCase() === String(name).toLowerCase());
  return k ? String(headers[k] || '') : '';
}

export async function requireOwnerFromEvent(event){
  const expected = getEnvKey();
  if (!expected) return { ok:false, statusCode: 500, error:'Owner key env missing (set TKFM_OWNER_KEY)' };

  const headers = event && event.headers ? event.headers : {};
  const key1 = String(readHeader(headers, 'x-tkfm-owner-key') || '').trim();
  const auth = String(readHeader(headers, 'authorization') || '').trim();
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';

  const provided = key1 || bearer;
  if (!provided) return { ok:false, statusCode: 401, error:'Missing owner key' };
  if (provided !== expected) return { ok:false, statusCode: 403, error:'Invalid owner key' };

  return { ok:true, statusCode: 200 };
}
