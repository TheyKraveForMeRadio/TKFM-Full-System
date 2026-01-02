(function () {
  const LS_KEY = 'tkfm_user_features';

  // These are the ONLY ones you said still failing
  const TITLE_TO_PLAN = {
    'ai dj autopilot': 'ai_dj_autopilot_monthly',
    'analytics pro': 'analytics_pro_monthly',
    'city sponsor': 'city_sponsor_monthly',
    'takeover sponsor': 'takeover_sponsor_monthly',
    'feature verse kit': 'feature_verse_kit',
    'imaging pack': 'imaging_pack',
    'launch campaign': 'launch_campaign',
    'label brand pack': 'label_brand_pack'
  };

  function norm(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-]/g, '')
      .trim();
  }

  function uniq(arr) { return Array.from(new Set((arr || []).filter(Boolean))); }

  function getStore() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function setStore(obj) { localStorage.setItem(LS_KEY, JSON.stringify(obj || {})); }

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

  function isClickable(el) {
    const tag = (el && el.tagName ? el.tagName.toLowerCase() : '');
    return tag === 'button' || tag === 'a';
  }

  function planFromElement(el) {
    if (!el || !el.getAttribute) return '';
    return el.getAttribute('data-plan') || el.getAttribute('data-feature') || '';
  }

  // Finds ANY element that contains the title text (not just headings),
  // then tags the nearest button/link in that “card”.
  function autoTagByTextAnywhere() {
    const keys = Object.keys(TITLE_TO_PLAN);

    // Search in common text elements
    const pool = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,p,span,strong,div,section,article,li'));
    const poolText = pool.map(n => norm(n.textContent));

    keys.forEach((k) => {
      const planId = TITLE_TO_PLAN[k];

      // Find first node whose text contains the title (handles formatting like line breaks)
      let hit = null;
      for (let i = 0; i < pool.length; i++) {
        if (poolText[i] && poolText[i].includes(k)) { hit = pool[i]; break; }
      }
      if (!hit) return;

      // Walk up to a reasonable container/card
      const card =
        hit.closest('article,section,.card,.panel,.pricing-card,.tier,.plan,li,div') ||
        hit.parentElement;

      if (!card) return;

      // Find a likely CTA inside this card
      const ctas = Array.from(card.querySelectorAll('button,a'));
      if (!ctas.length) return;

      // Prefer explicit CTAs
      let btn =
        ctas.find(x => /checkout|buy|purchase|get|start|unlock|select/i.test(String(x.textContent || ''))) ||
        ctas.find(x => x.classList && (x.classList.contains('btn') || x.classList.contains('button'))) ||
        ctas[0];

      if (!btn) return;

      if (!btn.getAttribute('data-plan') && !btn.getAttribute('data-feature')) {
        btn.setAttribute('data-plan', planId);
      }
      btn.setAttribute('data-checkout', '1');
    });
  }

  function bindButtons() {
    autoTagByTextAnywhere();

    const candidates = Array.from(document.querySelectorAll('[data-plan],[data-feature],[data-checkout],button,a'));
    candidates.forEach((el) => {
      if (el.__tkfmBound) return;
      if (!isClickable(el)) return;

      const planId = planFromElement(el);
      const explicit = el.hasAttribute('data-checkout') || el.hasAttribute('data-plan') || el.hasAttribute('data-feature');

      if (!explicit && !planId) return;

      el.__tkfmBound = true;

      el.addEventListener('click', async (e) => {
        const p = planFromElement(el);
        if (!p) return;
        e.preventDefault();

        const qty = (el.getAttribute && (el.getAttribute('data-qty') || el.getAttribute('data-quantity'))) || 1;

        const old = el.textContent;
        try { el.setAttribute('disabled', 'disabled'); } catch (_) {}
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

    const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };

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
