// TKFM: Server-side entitlements sync (Stripe customer -> Supabase entitlements)
// - Reads localStorage.tkfm_stripe_customer_id
// - Fetches entitlements from /.netlify/functions/get-entitlements
// - Merges unlocks into localStorage.tkfm_user_features
// - Stores status in localStorage.tkfm_entitlement_status

function safeJsonParse(v, fallback) {
  try { return JSON.parse(v); } catch (_) { return fallback; }
}

export function getLocalUnlocks() {
  const v = safeJsonParse(localStorage.getItem('tkfm_user_features') || '[]', []);
  return Array.isArray(v) ? v : [];
}

export function setLocalUnlocks(arr) {
  const clean = Array.from(new Set((arr || []).map(String).filter(Boolean)));
  localStorage.setItem('tkfm_user_features', JSON.stringify(clean));
  return clean;
}

export function getCustomerId() {
  return String(localStorage.getItem('tkfm_stripe_customer_id') || '').trim();
}

export function getEntitlementStatus() {
  return String(localStorage.getItem('tkfm_entitlement_status') || '').trim() || 'unknown';
}

export async function syncEntitlements() {
  const customerId = getCustomerId();
  if (!customerId) {
    localStorage.setItem('tkfm_entitlement_status', 'unknown');
    return { ok: true, enabled: false, found: false, status: 'unknown', unlocks: getLocalUnlocks() };
  }

  const res = await fetch('/.netlify/functions/get-entitlements?customer_id=' + encodeURIComponent(customerId));
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data || !data.ok) {
    localStorage.setItem('tkfm_entitlement_status', 'unknown');
    return { ok: false, error: data?.error || 'entitlements_fetch_failed', status: 'unknown', unlocks: getLocalUnlocks() };
  }

  // If backend isn't enabled, we still keep local unlocks working
  if (!data.enabled) {
    localStorage.setItem('tkfm_entitlement_status', 'unknown');
    return { ok: true, enabled: false, found: false, status: 'unknown', unlocks: getLocalUnlocks() };
  }

  const serverUnlocks = Array.isArray(data.unlocks) ? data.unlocks : [];
  const merged = setLocalUnlocks(getLocalUnlocks().concat(serverUnlocks));

  localStorage.setItem('tkfm_entitlement_status', String(data.status || 'unknown'));

  return {
    ok: true,
    enabled: true,
    found: !!data.found,
    status: String(data.status || 'unknown'),
    unlocks: merged,
    serverUnlocks
  };
}
