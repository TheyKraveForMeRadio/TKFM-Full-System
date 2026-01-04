(() => {
  // TKFM: Boost Checkout (Rotation Boost only) — Auto-submit via webhook
  // Requires inputs:
  //   [data-boost-title] (optional)
  //   [data-boost-url]   (required)
  // Buttons:
  //   <button data-boost-plan="rotation_boost_7d">...</button>
  // Endpoint:
  //   /.netlify/functions/create-boost-checkout-session (stores pending + sets metadata token)

  function $ (sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function normalizeUrl(v) {
    let s = String(v || '').trim();
    if (!s) return '';
    if (!/^https?:\/\//i.test(s) && /^[a-z0-9.-]+\.[a-z]{2,}/i.test(s)) s = 'https://' + s;
    return s;
  }

  async function start(planId, title, url) {
    const res = await fetch('/.netlify/functions/create-boost-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, title, url })
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

        const titleEl = $('[data-boost-title]');
        const urlEl = $('[data-boost-url]');

        const title = titleEl ? String(titleEl.value || '').trim() : '';
        const url = normalizeUrl(urlEl ? urlEl.value : '');

        if (!url) { alert('Paste a URL to boost first'); return; }

        b.disabled = true;
        start(planId, title, url).finally(() => { b.disabled = false; });
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
