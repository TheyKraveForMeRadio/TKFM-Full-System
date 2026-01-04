(() => {
  // TKFM: Boost Checkout (Rotation Boost only)
  // Buttons: <button data-boost-plan="rotation_boost_7d">...</button>
  // Uses /.netlify/functions/create-boost-checkout-session

  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  async function start(planId) {
    const res = await fetch('/.netlify/functions/create-boost-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok || !data.url) {
      alert((data && data.error) ? data.error : 'Checkout failed');
      return;
    }
    window.location.href = data.url;
  }

  function bind() {
    const btns = $all('[data-boost-plan]');
    if (!btns.length) return;

    btns.forEach((b) => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        const planId = String(b.getAttribute('data-boost-plan') || '').trim();
        if (!planId) return;
        b.disabled = true;
        start(planId).finally(() => { b.disabled = false; });
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
