// TKFM Checkout + Live Price Loader
// - Click any element with data-plan OR data-feature to start Stripe checkout
// - Auto-load prices into any element with [data-price-for="lookup_key"] via price-info function
// - Shows a toast with the missing STRIPE_PRICE_* env var if mapping is not set

(function () {
  function fmtMoney(unit_amount, currency) {
    if (unit_amount == null) return '';
    const n = Number(unit_amount) / 100;
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'USD').toUpperCase() }).format(n);
    } catch (e) {
      return '$' + n.toFixed(2);
    }
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

  async function checkout(planId, btn) {
    if (!planId) return;
    const busyClass = 'opacity-60 pointer-events-none';
    if (btn) btn.classList.add(...busyClass.split(' '));
    try {
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok || !data.url) {
        const err = (data && (data.error || data.message)) ? (data.error || data.message) : 'Checkout failed';
        const hint = (data && data.example) ? (' • ' + data.example) : '';
        toast(`❌ ${err}${hint}`, false);
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      toast('❌ Checkout error. Open DevTools → Network for details.', false);
    } finally {
      if (btn) btn.classList.remove(...busyClass.split(' '));
    }
  }

  window.TKFM_START_CHECKOUT = checkout;

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-plan],[data-feature]');
    if (!t) return;
    const planId = t.getAttribute('data-plan') || t.getAttribute('data-feature');
    if (!planId) return;
    e.preventDefault();
    checkout(planId, t);
  });

  const cache = new Map();

  async function loadPrice(planId) {
    if (!planId) return null;
    if (cache.has(planId)) return cache.get(planId);

    const p = fetch('/.netlify/functions/price-info?planId=' + encodeURIComponent(planId))
      .then(r => r.json().catch(() => ({})).then(j => ({ ok: r.ok && j.ok, ...j })))
      .catch(() => ({ ok: false }));

    cache.set(planId, p);
    return p;
  }

  async function hydratePrices() {
    const nodes = Array.from(document.querySelectorAll('[data-price-for]'));
    if (!nodes.length) return;

    const keys = Array.from(new Set(nodes.map(n => n.getAttribute('data-price-for')).filter(Boolean)));

    for (const key of keys) {
      const data = await loadPrice(key);
      const priceText = (data && data.ok)
        ? (fmtMoney(data.unit_amount, data.currency) + (data.interval ? ('/' + data.interval) : ''))
        : '';

      nodes.forEach(n => {
        if (n.getAttribute('data-price-for') !== key) return;
        n.textContent = priceText || '—';
      });

      if (data && data.ok === false && data.missing_env) {
        toast(`❌ Missing env var ${data.missing_env} for ${key}`, false);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', hydratePrices);
})();
