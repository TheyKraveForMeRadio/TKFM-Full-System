(function () {
  const LS_KEY = 'tkfm_user_features';

  function getStore() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
    catch (_) { return {}; }
  }
  function setStore(obj) {
    localStorage.setItem(LS_KEY, JSON.stringify(obj || {}));
  }
  function uniq(arr) {
    return Array.from(new Set((arr || []).filter(Boolean)));
  }
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

  function bindButtons() {
    const btns = Array.from(document.querySelectorAll('[data-plan]'));
    btns.forEach((btn) => {
      if (btn.__tkfmBound) return;
      btn.__tkfmBound = true;

      btn.addEventListener('click', async (e) => {
        const a = btn.closest('a');
        if (a && a.getAttribute('href') && a.getAttribute('href') !== '#') {
          // If it's a real link, let it navigate (unless explicitly marked checkout)
          if (!btn.hasAttribute('data-checkout')) return;
          e.preventDefault();
        } else {
          e.preventDefault();
        }

        const planId = btn.getAttribute('data-plan');
        const qty = btn.getAttribute('data-qty') || 1;

        // UI feedback
        const old = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Redirecting…';

        try {
          await startCheckout(planId, qty);
        } catch (err) {
          btn.disabled = false;
          btn.textContent = old || 'Checkout';
          alert('Checkout error: ' + String(err.message || err));
        }
      });
    });
  }

  // Auto-run on success page if session_id present
  async function autoVerifyOnSuccess() {
    const url = new URL(window.location.href);
    const sid = url.searchParams.get('session_id');
    if (!sid) return;

    // Minimal UI hook if elements exist
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
    } catch (e) {
      setText('statusTitle', 'Verification failed');
      setText('statusMsg', 'Refresh this page in 5 seconds or contact support.');
    }
  }

  // Expose helpers
  window.TKFMCheckout = { startCheckout, verifyAndUnlock };

  // Bind and run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { bindButtons(); autoVerifyOnSuccess(); });
  } else {
    bindButtons(); autoVerifyOnSuccess();
  }
})();
