(function () {
  const KEY_FEATURES = 'tkfm_user_features';
  const $ = (id) => document.getElementById(id);

  const qs = new URLSearchParams(window.location.search);
  const sessionId = (qs.get('session_id') || '').trim();

  function safeJsonParse(str, fallback) {
    try { return JSON.parse(str); } catch { return fallback; }
  }

  function setStatus(type, title, msg) {
    const box = $('statusBox');
    if (!box) return;
    box.className = 'status ' + type;
    const t = $('statusTitle');
    const m = $('statusMsg');
    if (t) t.textContent = title || '';
    if (m) m.textContent = msg || '';
  }

  function showRaw(text) {
    const rawBox = $('rawBox');
    const rawJson = $('rawJson');
    if (!rawBox || !rawJson) return;
    rawBox.style.display = 'block';
    rawJson.textContent = text || '(empty)';
  }

  function normalizeUnlocked(data) {
    if (!data || typeof data !== 'object') return [];

    const direct = [
      data.unlocked,
      data.planIds,
      data.features,
      data.unlockedPlanIds,
      data.unlocked_ids,
      data.ids
    ];

    for (const c of direct) {
      if (Array.isArray(c)) return c.filter(Boolean).map(String);
    }

    const listCandidates = [data.items, data.line_items, data.lineItems, data.products];
    for (const arr of listCandidates) {
      if (Array.isArray(arr)) {
        const ids = arr
          .map((x) => x && (x.planId || x.id || x.lookup_key || x.lookupKey || x.sku || x.price_lookup_key))
          .filter(Boolean)
          .map(String);
        if (ids.length) return ids;
      }
    }

    if (data.item && (data.item.planId || data.item.id)) {
      return [String(data.item.planId || data.item.id)];
    }

    return [];
  }

  function mergeFeatures(newOnes) {
    const existing = safeJsonParse(localStorage.getItem(KEY_FEATURES) || '[]', []);
    const a = Array.isArray(existing) ? existing : [];
    const b = Array.isArray(newOnes) ? newOnes : [];
    const set = new Set([...a, ...b].filter(Boolean).map(String));
    const merged = Array.from(set);
    localStorage.setItem(KEY_FEATURES, JSON.stringify(merged));
    return merged;
  }

  function renderUnlocked(list) {
    const ul = $('unlockedList');
    if (!ul) return;
    ul.innerHTML = '';

    if (!list || !list.length) {
      const li = document.createElement('li');
      li.textContent = 'No plan ids returned yet.';
      ul.appendChild(li);
      return;
    }

    list.forEach((id) => {
      const li = document.createElement('li');
      li.textContent = id;
      ul.appendChild(li);
    });
  }

    /* TKFM_DROPS_CREDITS_AWARD_START */
  const DROPS_PLAN_CREDITS = {
    ai_drops_starter_monthly: 20,
    ai_drops_pro_monthly: 60,
    ai_drops_studio_monthly: 200,
    drop_pack_10: 10,
    drop_pack_25: 25,
    drop_pack_100: 100,
    radio_imaging_bundle: 40,
    custom_voice_setup: 0,
    custom_voice_hosting_monthly: 0
  };

  function isDropsPlan(id){
    return Boolean(id && Object.prototype.hasOwnProperty.call(DROPS_PLAN_CREDITS, String(id)));
  }

  async function getStripeCustomerId(sessionId){
    try{
      const r = await fetch(`/.netlify/functions/checkout-session-get?session_id=${encodeURIComponent(sessionId)}`, { method: 'GET', credentials: 'same-origin' });
      if (!r.ok) return null;
      const data = await r.json().catch(()=>null);
      const cust = data && (data.customer || (data.session && data.session.customer));
      return cust ? String(cust) : null;
    }catch(_){
      return null;
    }
  }

  async function awardDropsCredits(sessionId, unlockedIds){
    try{
      const ids = Array.isArray(unlockedIds) ? unlockedIds.map(String) : [];
      const dropsIds = ids.filter(isDropsPlan);
      if (!dropsIds.length) return { ok:true, skipped:true, reason:'no_drops_plans' };

      const customerId = await getStripeCustomerId(sessionId);
      if (!customerId) return { ok:false, error:'No Stripe customer id' };

      // store for wallet
      try { localStorage.setItem('tkfm_stripe_customer_id', customerId); } catch(_) {}

      // award each plan (server-side de-dupes by session_id+planId)
      for (const planId of dropsIds){
        await fetch('/.netlify/functions/drops-credits-add', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ customerId, planId, session_id: sessionId }),
          credentials: 'same-origin'
        }).catch(()=>null);
      }
      return { ok:true, customerId, awarded: dropsIds };
    }catch(e){
      return { ok:false, error: String(e?.message || e) };
    }
  }
  /* TKFM_DROPS_CREDITS_AWARD_END */

async function verifySession(sessionId) {
    const getUrl = `/.netlify/functions/verify-checkout-session?session_id=${encodeURIComponent(sessionId)}`;

    // Try GET first
    try {
      const r = await fetch(getUrl, { method: 'GET', credentials: 'same-origin' });
      if (r && r.ok) return r;
    } catch (_) {}

    // Fallback POST
    return fetch('/.netlify/functions/verify-checkout-session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
      credentials: 'same-origin'
    });
  }

  function wireButtons() {
    const copyBtn = $('copyBtn');
    const clearBtn = $('clearBtn');

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(sessionId || '');
          setStatus('good', 'Copied', 'session_id copied to clipboard.');
        } catch {
          setStatus('warn', 'Copy failed', 'Could not copy automatically. Select the session id and copy manually.');
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        localStorage.removeItem(KEY_FEATURES);
        renderUnlocked([]);
        setStatus('warn', 'Cleared (debug)', 'Removed tkfm_user_features from localStorage.');
      });
    }
  }

  async function run() {
    const sidEl = $('sessionId');
    if (sidEl) sidEl.textContent = sessionId || '(missing)';

    wireButtons();

    if (!sessionId) {
      setStatus('bad', 'Missing session_id', 'Stripe did not send a session id. Go back to pricing and try checkout again.');
      renderUnlocked([]);
      return;
    }

    setStatus('wait', 'Verifying purchase…', 'Calling verify-checkout-session and applying your unlocks now.');

    try {
      const res = await verifySession(sessionId);
      const text = await res.text();

      let data = {};
      try { data = JSON.parse(text || '{}'); } catch { data = { raw: text }; }

      if (!res || !res.ok) {
        setStatus('bad', 'Verification failed', 'verify-checkout-session returned an error. Payment may still be fine — copy the session id and contact support.');
        showRaw(text);
        return;
      }

      const unlocked = normalizeUnlocked(data);
      const merged = mergeFeatures(unlocked);

      if (unlocked.length) {
        setStatus('good', 'Unlocked', 'Your TKFM access is now unlocked on this device.');
      } else {
        setStatus('warn', 'Verified, but no plan IDs returned', 'Payment verified but no plan ids were returned. Check verify-checkout-session output.');
        showRaw(text);
      }

      renderUnlocked(merged);
    } catch (err) {
      setStatus('bad', 'Network error', 'Could not reach verify-checkout-session. Try refreshing. If it keeps failing, check Netlify function logs.');
      showRaw(String(err && err.stack ? err.stack : err));
    }
  }

  run();
})();