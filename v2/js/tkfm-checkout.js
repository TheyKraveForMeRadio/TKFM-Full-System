(function () {
  const LS_KEY = 'tkfm_user_features';

  // Title -> planId mapping (covers the exact items you listed)
  const TITLE_TO_PLAN = {
    'priority submission pack': 'priority_submission_pack',
    'playlist pitch pack': 'playlist_pitch_pack',
    'press run pack': 'press_run_pack',
    'homepage takeover day': 'homepage_takeover_day',

    'ai dj autopilot': 'ai_dj_autopilot_monthly',
    'analytics pro': 'analytics_pro_monthly',

    'starter sponsor': 'starter_sponsor_monthly',
    'city sponsor': 'city_sponsor_monthly',
    'takeover sponsor': 'takeover_sponsor_monthly',

    'ai radio intro': 'ai_radio_intro',
    'feature verse kit': 'feature_verse_kit',
    'imaging pack': 'imaging_pack',
    'ai social pack': 'ai_social_pack',
    'launch campaign': 'launch_campaign',
    'label brand pack': 'label_brand_pack',

    'distribution assist': 'distribution_assist_monthly',
  };

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-]/g, '')
      .trim();
  }

  function getStore() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function setStore(obj) { localStorage.setItem(LS_KEY, JSON.stringify(obj || {})); }
  function uniq(arr) { return Array.from(new Set((arr || []).filter(Boolean))); }

  function mergeUnlocks(unlocked, sessionId) {
    const s = getStore();
    s.unlocked = uniq([...(s.unlocked || []), ...(unlocked || [])]);
    if (sessionId) s.last_session_id = sessionId;
    s.last_verified_at = new Date().toISOString();
    setStore(s);
    return s;
  }

  async function postJSON(url, body) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || j.ok === false) {
      const msg = (j && (j.message || j.error)) ? (j.message || j.error) : ('HTTP_' + r.status);
      throw new Error(msg);
    }
    return j;
  }

  async function startCheckout(planId, quantity) {
    const payload = { planId, quantity: Math.max(1, Number(quantity || 1)) };
    const j = await postJSON('/.netlify/functions/create-checkout-session', payload);
    if (!j.url) throw new Error('missing_checkout_url');
    window.location.href = j.url;
  }

  async function verifyAndUnlock(sessionId) {
    const u = '/.netlify/functions/verify-checkout-session?session_id=' + encodeURIComponent(sessionId);
    const r = await fetch(u, { headers: { accept: 'application/json' } });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || j.ok === false) {
      const msg = (j && (j.message || j.error)) ? (j.message || j.error) : ('HTTP_' + r.status);
      throw new Error(msg);
    }
    const unlocked = Array.isArray(j.unlocked) ? j.unlocked : [];
    mergeUnlocks(unlocked, sessionId);
    return unlocked;
  }

  function closestTitle(el) {
    let cur = el;
    for (let i = 0; i < 8 && cur; i++) {
      // Look for headings in this container
      const h = cur.querySelector && cur.querySelector('h1,h2,h3,h4,[data-title],[data-name]');
      const txt = h ? (h.getAttribute('data-title') || h.getAttribute('data-name') || h.textContent) : '';
      const n = norm(txt);
      if (n) return n;
      cur = cur.parentElement;
    }
    return '';
  }

  function planFromElement(el) {
    // Priority: explicit attributes
    const dp = el.getAttribute && el.getAttribute('data-plan');
    if (dp) return dp;

    const df = el.getAttribute && el.getAttribute('data-feature');
    if (df) return df; // allow data-feature as plan id

    // Try infer from nearby title
    const t = closestTitle(el);
    if (t && TITLE_TO_PLAN[t]) return TITLE_TO_PLAN[t];

    return '';
  }

  function isClickable(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'button') return true;
    if (tag === 'a') return true;
    return false;
  }

  // Auto-tag known cards so even plain buttons work
  function autoTagKnownCards() {
    const keys = Object.keys(TITLE_TO_PLAN);
    keys.forEach((k) => {
      const planId = TITLE_TO_PLAN[k];

      // find headings matching the title
      const nodes = Array.from(document.querySelectorAll('h1,h2,h3,h4'));
      nodes.forEach((h) => {
        if (norm(h.textContent) !== k) return;

        // find a button/link inside the same card/container
        const root = h.closest('section,article,div') || h.parentElement;
        if (!root) return;

        const btn = root.querySelector('button,a');
        if (!btn) return;

        if (!btn.getAttribute('data-plan') && !btn.getAttribute('data-feature')) {
          btn.setAttribute('data-plan', planId);
          btn.setAttribute('data-checkout', '1');
        }
      });
    });
  }

  function bindButtons() {
    // Bind anything explicitly marked OR any button/link inside pricing-like pages after autoTagKnownCards()
    autoTagKnownCards();

    const candidates = Array.from(document.querySelectorAll('[data-plan],[data-feature],[data-checkout],button,a'));

    candidates.forEach((el) => {
      if (el.__tkfmBound) return;
      if (!isClickable(el)) return;

      // Only intercept if we can resolve a planId OR it was explicitly marked data-checkout
      const explicit = el.hasAttribute('data-checkout') || el.hasAttribute('data-plan') || el.hasAttribute('data-feature');
      const planId = planFromElement(el);

      if (!explicit && !planId) return;

      el.__tkfmBound = true;

      el.addEventListener('click', async (e) => {
        const p = planFromElement(el);
        if (!p) return;

        // If anchor, prevent default so we can redirect to Stripe
        e.preventDefault();

        const qty = el.getAttribute('data-qty') || 1;

        const old = el.textContent;
        try {
          el.setAttribute('disabled', 'disabled');
        } catch (_) {}
        try { el.textContent = 'Redirecting…'; } catch (_) {}

        try {
          await startCheckout(p, qty);
        } catch (err) {
          try { el.removeAttribute('disabled'); } catch (_) {}
          try { el.textContent = old || 'Checkout'; } catch (_) {}
          alert('Checkout error: ' + String(err.message || err));
        }
      });
    });
  }

  async function autoVerifyOnSuccess() {
    const url = new URL(window.location.href);
    const sid = url.searchParams.get('session_id');
    if (!sid) return;

    const setText = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };

    try {
      setText('statusTitle', 'Verifying…');
      setText('statusMsg', 'Unlocking your features now.');
      const unlocked = await verifyAndUnlock(sid);
      setText('statusTitle', 'Unlocked');
      setText('statusMsg', 'Your TKFM features are active.');
      setText('unlockedCount', String(unlocked.length));
    } catch (_) {
      setText('statusTitle', 'Verification failed');
      setText('statusMsg', 'Refresh this page in 5 seconds.');
    }
  }

  window.TKFMCheckout = { startCheckout, verifyAndUnlock, bindButtons };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { bindButtons(); autoVerifyOnSuccess(); });
  } else {
    bindButtons(); autoVerifyOnSuccess();
  }
})();
