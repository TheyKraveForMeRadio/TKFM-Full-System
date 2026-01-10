// TKFM Subscription Guard (Client helper)
// Depends on: /.netlify/functions/subscription-check?email=...
// Syncs tkfm_user_features to match active Stripe subscriptions (active/trialing)

(function () {
  const LS_FEATURES = 'tkfm_user_features';
  const LS_EMAIL = 'tkfm_customer_email';

  function getFeatures() {
    try { return JSON.parse(localStorage.getItem(LS_FEATURES) || '[]') || []; }
    catch (e) { return []; }
  }

  function setFeatures(arr) {
    localStorage.setItem(LS_FEATURES, JSON.stringify(Array.from(new Set(arr || []))));
  }

  async function checkByEmail(email) {
    const url = '/.netlify/functions/subscription-check?email=' + encodeURIComponent(String(email || '').trim().toLowerCase());
    const res = await fetch(url);
    const out = await res.json().catch(() => ({}));
    if (!out || out.ok !== true) return { ok: false, activePlanIds: [] };
    return { ok: true, activePlanIds: Array.isArray(out.activePlanIds) ? out.activePlanIds : [] };
  }

  async function sync(requiredPlans) {
    const email = String(localStorage.getItem(LS_EMAIL) || '').trim();
    if (!email) return { ok: false, reason: 'missing_email', activePlanIds: [] };

    let data;
    try { data = await checkByEmail(email); }
    catch (e) { return { ok: false, reason: 'network', activePlanIds: [] }; }

    const active = new Set(data.activePlanIds || []);
    const req = (requiredPlans || []).filter(Boolean);

    const feats = getFeatures();

    // Remove any required plan that is not active
    const kept = feats.filter(k => {
      if (!req.includes(k)) return true;
      return active.has(k);
    });

    // Add any active required plans
    for (const k of req) {
      if (active.has(k) && !kept.includes(k)) kept.push(k);
    }

    setFeatures(kept);
    return { ok: true, activePlanIds: Array.from(active), email };
  }

  async function requireAny(requiredPlans, opts) {
    const required = (requiredPlans || []).filter(Boolean);
    const lockedEl = opts && opts.lockedEl ? opts.lockedEl : document.getElementById('locked');
    const unlockedEl = opts && opts.unlockedEl ? opts.unlockedEl : document.getElementById('unlocked');
    const msgEl = opts && opts.msgEl ? opts.msgEl : null;

    if (!required.length) return true;

    const r = await sync(required);

    if (!r.ok) {
      if (lockedEl) lockedEl.classList.remove('hidden');
      if (unlockedEl) unlockedEl.classList.add('hidden');
      if (msgEl) msgEl.textContent = (r.reason === 'missing_email')
        ? 'Missing email — complete any checkout once so we can verify your monthly access.'
        : 'Could not verify subscription right now. Try again in a moment.';
      return false;
    }

    const feats = getFeatures();
    const has = required.some(k => feats.includes(k));

    if (lockedEl) lockedEl.classList.toggle('hidden', has);
    if (unlockedEl) unlockedEl.classList.toggle('hidden', !has);
    if (msgEl) msgEl.textContent = has ? '' : 'No active monthly subscription found for this page.';

    return has;
  }

  window.TKFM_SUBSCRIPTION_SYNC = sync;
  window.TKFM_REQUIRE_ANY_SUB = requireAny;
  window.TKFM_SUB_EMAIL_KEY = LS_EMAIL;
  window.TKFM_SUB_FEATURES_KEY = LS_FEATURES;
})();
