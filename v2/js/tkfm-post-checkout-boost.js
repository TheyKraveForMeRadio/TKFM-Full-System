// TKFM: Post-checkout handler (Boost)
// - Verifies Stripe session server-side
// - Unlocks boost feature in localStorage with expiry
// - Redirects back to rotation-boost page (or stays and shows status)
(function () {
  const OUT = document.getElementById('tkfmPostCheckoutOut');
  const BTN = document.getElementById('tkfmPostCheckoutContinue');
  const ENDPOINT = '/.netlify/functions/verify-boost-session';

  function log(line) {
    if (!OUT) return;
    OUT.textContent = String(OUT.textContent || '') + line + '\n';
  }

  function qs() {
    const u = new URL(window.location.href);
    return u.searchParams;
  }

  function getStore(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function setStore(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  async function postJson(data) {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    });
    const txt = await r.text();
    let j = null;
    try { j = JSON.parse(txt); } catch (e) {}
    return { ok: r.ok, status: r.status, json: j, text: txt };
  }

  function applyUnlock(lookup, durationDays, sessionId) {
    const now = Date.now();
    const exp = now + (durationDays * 24 * 60 * 60 * 1000);

    // Primary: features map
    const feats = getStore('tkfm_user_features', {});
    feats[lookup] = true;
    setStore('tkfm_user_features', feats);

    // Boost entitlements w/ expiry (separate, safe)
    const ent = getStore('tkfm_boost_entitlements', {});
    ent[lookup] = { active: true, expires_at: exp, session_id: sessionId, granted_at: now };
    setStore('tkfm_boost_entitlements', ent);

    // last purchase
    setStore('tkfm_last_purchase', { lookup, duration_days: durationDays, session_id: sessionId, at: now });

    // convenience: allow ?unlocked=... logic
    try {
      const u = new URL(window.location.origin + '/rotation-boost.html');
      u.searchParams.set('unlocked', lookup);
      u.searchParams.set('session_id', sessionId);
      u.searchParams.set('expires_at', String(exp));
      return u.toString();
    } catch (e) {
      return '/rotation-boost.html?unlocked=' + encodeURIComponent(lookup);
    }
  }

  async function main() {
    const p = qs();
    const sessionId = (p.get('session_id') || '').trim();
    const plan = (p.get('plan') || '').trim();

    log('TKFM Post Checkout — Boost');
    if (plan) log('plan=' + plan);
    if (!sessionId) {
      log('Missing session_id in URL.');
      log('Tip: return URL should include &session_id={CHECKOUT_SESSION_ID}');
      return;
    }

    log('Verifying session...');
    const res = await postJson({ session_id: sessionId });

    if (!res.json) {
      log('No JSON response. Status=' + res.status);
      log(res.text || '');
      return;
    }

    if (!res.json.ok) {
      log('Verify failed: ' + (res.json.error || 'Unknown error'));
      return;
    }

    if (res.json.paid === false) {
      log('Not paid yet. payment_status=' + (res.json.payment_status || 'unknown'));
      log('If you just paid, refresh in a few seconds.');
      return;
    }

    const lookup = res.json.lookup;
    const days = res.json.duration_days;

    if (!lookup || !days) {
      log('Paid, but missing lookup/duration. Check server response:');
      log(JSON.stringify(res.json, null, 2));
      return;
    }

    log('PAID ✅');
    log('Unlocking: ' + lookup + ' (' + days + ' days)');
    const target = applyUnlock(lookup, days, sessionId);

    if (BTN) {
      BTN.style.display = 'inline-flex';
      BTN.href = target;
    }

    // auto-redirect after a beat
    setTimeout(function () {
      window.location.href = target;
    }, 900);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
