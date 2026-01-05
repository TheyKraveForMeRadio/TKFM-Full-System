// TKFM: Boost Checkout Interceptor
// Prevents generic checkout wiring from handling boost buttons and routes them to a dedicated endpoint.
(function () {
  const BOOST_KEYS = new Set(['rotation_boost_7d', 'rotation_boost_30d']);
  const ENDPOINT = '/.netlify/functions/create-boost-checkout-session';

  function getKeyFromEl(el) {
    if (!el) return '';
    const a = el.getAttribute('data-plan') || '';
    const b = el.getAttribute('data-feature') || '';
    const c = el.getAttribute('data-plan-id') || '';
    const d = el.getAttribute('data-lookup-key') || '';
    return (a || b || c || d || '').trim();
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

  async function runBoostCheckout(key) {
    const res = await postJson({ planId: key });
    const url = res?.json?.url || res?.json?.checkout_url || res?.json?.checkoutUrl || '';
    if (url) {
      window.location.href = url;
      return;
    }
    // Fallback: show minimal error
    alert('Boost checkout failed. Status: ' + res.status + '\n' + (res?.json?.error || res.text || 'Unknown error'));
  }

  // Capture-phase listener so it wins over other click handlers.
  document.addEventListener('click', function (e) {
    const btn = e.target && (e.target.closest ? e.target.closest('[data-plan],[data-feature],[data-plan-id],[data-lookup-key]') : null);
    if (!btn) return;

    const key = getKeyFromEl(btn);
    if (!BOOST_KEYS.has(key)) return;

    // Mark + stop other handlers
    if (btn.dataset.tkfmBoostLock === '1') return;
    btn.dataset.tkfmBoostLock = '1';

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

    runBoostCheckout(key);
  }, true);
})();
