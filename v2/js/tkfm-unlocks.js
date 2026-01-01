// TKFM V2 Unlock Utilities
// Reads/writes localStorage.tkfm_user_features
// Used by unlocks.html + can be imported elsewhere.

export function getUnlocks() {
  try {
    const v = JSON.parse(localStorage.getItem('tkfm_user_features') || '[]');
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

export function setUnlocks(arr) {
  const clean = Array.from(new Set((arr || []).map(String).filter(Boolean)));
  localStorage.setItem('tkfm_user_features', JSON.stringify(clean));
  return clean;
}

export function addUnlock(id) {
  const cur = getUnlocks();
  cur.push(String(id));
  return setUnlocks(cur);
}

export function clearUnlocks() {
  localStorage.removeItem('tkfm_user_features');
  localStorage.removeItem('tkfm_stripe_customer_id');
  localStorage.removeItem('tkfm_owner_unlocked');
  localStorage.removeItem('tkfm_owner_key');
}
