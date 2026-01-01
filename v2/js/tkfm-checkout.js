// TKFM V2 universal checkout binder
// Binds any element with [data-plan] to Stripe Checkout via Netlify Function.
// Optional attributes:
//   data-qty="2"
//   data-label="Mixtape Hosting Pro"

function getPlanId(el) {
  return el.getAttribute('data-plan') || el.dataset.plan || null;
}

function getQty(el) {
  const q = Number(el.getAttribute('data-qty') || el.dataset.qty || 1);
  return Number.isFinite(q) && q > 0 ? Math.floor(q) : 1;
}

async function startCheckout(planId, quantity = 1) {
  const res = await fetch('/.netlify/functions/create-checkout-session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ planId, quantity })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data || !data.url) {
    console.error('Checkout failed:', data);
    alert('Checkout error. Please try again or contact support.');
    return;
  }

  window.location.href = data.url;
}

function bind() {
  const els = Array.from(document.querySelectorAll('[data-plan]'));
  els.forEach(el => {
    if (el.__tkfmBound) return;
    el.__tkfmBound = true;

    el.addEventListener('click', (e) => {
      const planId = getPlanId(el);
      if (!planId) return;
      e.preventDefault();
      e.stopPropagation();
      startCheckout(planId, getQty(el));
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  bind();
  const mo = new MutationObserver(() => bind());
  mo.observe(document.documentElement, { childList: true, subtree: true });
});
