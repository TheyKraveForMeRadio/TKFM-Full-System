const FN_CREATE = '/.netlify/functions/create-checkout-session';

function pickId(el) {
  return el.getAttribute('data-plan') || el.getAttribute('data-feature') || el.dataset.plan || el.dataset.feature;
}

function saveReturnUrl() {
  try { localStorage.setItem('tkfm_return_url', window.location.pathname + window.location.search + window.location.hash); } catch {}
}

async function startCheckout(id) {
  saveReturnUrl();

  const res = await fetch(FN_CREATE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) {
    const msg = data?.error ? String(data.error) : 'Checkout failed';
    alert(msg);
    return;
  }

  window.location.href = data.url;
}

function wire() {
  const btns = Array.from(document.querySelectorAll('[data-plan],[data-feature]'));
  btns.forEach((btn) => {
    if (btn.__tkfmCheckoutWired) return;
    const id = pickId(btn);
    if (!id) return;

    btn.__tkfmCheckoutWired = true;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      startCheckout(id);
    });
  });
}

wire();
new MutationObserver(wire).observe(document.documentElement, { childList: true, subtree: true });
