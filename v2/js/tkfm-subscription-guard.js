// TKFM Subscription Guard (Server-Verified)
// Requires: netlify/functions/subscription-check.js
// Reads customer email from localStorage (tkfm_customer_email)
// Confirms active/trialing subscriptions, then syncs tkfm_user_features

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

  function toast(msg, ok) {
    try {
      const el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = `
        <div class="rounded-2xl border ${ok ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100' : 'border-red-500/40 bg-red-500/10 text-red-100'}
          px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-xl">
          ${String(msg || '')}
        </div>`;
      document.body.appendChild(el);
      setTimeout(() => { el.remove(); }, 5200);
    } catch (e) {}
  }

  async function checkByEmail(email) {
    const url = '/.netlify/functions/subscription-check?email=' + encodeURIComponent(String(email || '').trim().toLowerCase());
    const res = await fetch(url);
    const out = await res.json().catch(() => ({}));
    if (!out || out.ok !== true) return { ok: false, activePlanIds: [] };
    return { ok: true, activePlanIds: Array.isArray(out.activePlanIds) ? out.activePlanIds : [] };
  }

  // Sync localStorage features against active subscriptions for the keys we care about
  async function sync(requiredPlans) {
    const email = String(localStorage.getItem(LS_EMAIL) || '').trim();
    if (!email) {
      return { ok: false, reason: 'missing_email', activePlanIds: [] };
    }

    let data;
    try {
      data = await checkByEmail(email);
    } catch (e) {
      return { ok: false, reason: 'network', activePlanIds: [] };
    }

    const active = new Set(data.activePlanIds || []);
    const req = (requiredPlans || []).filter(Boolean);

    const feats = getFeatures();

    // Remove any required plan that is NOT active (server says canceled)
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

    // If no required plans, allow
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

  // Expose
  window.TKFM_SUBSCRIPTION_SYNC = sync;
  window.TKFM_REQUIRE_ANY_SUB = requireAny;
  window.TKFM_SUB_EMAIL_KEY = LS_EMAIL;
  window.TKFM_SUB_FEATURES_KEY = LS_FEATURES;
})();
