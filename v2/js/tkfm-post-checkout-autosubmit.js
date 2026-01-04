(() => {
  // TKFM: after Stripe success, auto-open paid lane submission modal.
  // Works with tkfm-paid-lane-modal.js (window.TKFM_OPEN_PAID_LANE or ?open_paid_lane=1).

  function isPostCheckout() {
    const p = (location.pathname || '').toLowerCase();
    return p.endsWith('/post-checkout.html') || p.endsWith('post-checkout.html');
  }

  function getLaneId() {
    const u = new URL(location.href);
    const qp =
      u.searchParams.get('lane') ||
      u.searchParams.get('plan') ||
      u.searchParams.get('feature') ||
      '';

    const fromLS =
      localStorage.getItem('tkfm_last_plan') ||
      localStorage.getItem('tkfm_last_lane') ||
      localStorage.getItem('tkfm_last_purchase') ||
      '';

    return String(qp || fromLS || '').trim();
  }

  function alreadyOpened() {
    return localStorage.getItem('tkfm_post_checkout_opened') === '1';
  }

  function markOpened() {
    localStorage.setItem('tkfm_post_checkout_opened', '1');
    // auto-clear after a little while so future purchases work
    setTimeout(() => localStorage.removeItem('tkfm_post_checkout_opened'), 25_000);
  }

  function openModal(laneId) {
    // Prefer direct API
    if (typeof window.TKFM_OPEN_PAID_LANE === 'function') {
      window.TKFM_OPEN_PAID_LANE(laneId);
      return true;
    }

    // Fallback: add params and reload once
    const u = new URL(location.href);
    if (u.searchParams.get('open_paid_lane') !== '1') {
      u.searchParams.set('open_paid_lane', '1');
      if (laneId) u.searchParams.set('lane', laneId);
      location.replace(u.toString());
      return true;
    }

    return false;
  }

  function boot() {
    if (!isPostCheckout()) return;
    if (alreadyOpened()) return;

    const laneId = getLaneId();
    if (!laneId) return;

    markOpened();

    // Let other scripts load first
    setTimeout(() => openModal(laneId), 450);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
