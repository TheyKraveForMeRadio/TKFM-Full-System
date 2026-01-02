(function () {
  async function startCheckout(planId, qty) {
    try {
      planId = String(planId || '').trim();
      qty = Math.max(1, Number(qty || 1));

      if (!planId) {
        alert('Checkout error: missing planId (data-plan).');
        return;
      }

      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ planId, quantity: qty })
      });

      const data = await res.json().catch(() => ({}));

      if (!data || !data.ok || !data.url) {
        const msg = (data && (data.message || data.error)) ? (data.message || data.error) : ('HTTP ' + res.status);
        console.error('Checkout failed:', data);
        alert('Checkout failed for "' + planId + '": ' + msg);
        return;
      }

      window.location.href = data.url;
    } catch (e) {
      console.error(e);
      alert('Checkout crashed: ' + String(e && e.message ? e.message : e));
    }
  }

  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-plan],[data-feature],[data-planid],[data-checkout]');
    if (!el) return;

    const planId =
      el.getAttribute('data-plan') ||
      el.getAttribute('data-feature') ||
      el.getAttribute('data-planid') ||
      '';

    if (!planId) return;

    e.preventDefault();
    e.stopPropagation();
    startCheckout(planId, el.getAttribute('data-qty') || 1);
  }, true);

  console.log('TKFM checkout handler loaded');
})();
