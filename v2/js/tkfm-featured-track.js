(() => {
  // TKFM: Featured tracking (impressions + clicks)
  // Uses data-featured-id="<id>" when present.
  // Fallback: compute stable id from href via /js/tkfm-featured-id.js (window.tkfmFeaturedIdFromUrl)

  const ENDPOINT = '/.netlify/functions/featured-media-track';

  function post(payload) {
    try {
      const body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(ENDPOINT, blob);
        return;
      }
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      }).catch(() => {});
    } catch (_) {}
  }

  function computeIdFromEl(el) {
    const attr = String(el.getAttribute('data-featured-id') || '').trim();
    if (attr) return attr;

    const href = (el.getAttribute('href') || el.querySelector?.('a[href]')?.getAttribute('href') || '').trim();
    if (href && typeof window.tkfmFeaturedIdFromUrl === 'function') {
      const id = window.tkfmFeaturedIdFromUrl(href);
      if (id) return id;
    }
    return '';
  }

  function markImpressions(root = document) {
    const nodes = root.querySelectorAll('[data-featured-id], .tkfmFeaturedItem, .tkfm-featured-item, [data-featured-track]');
    nodes.forEach((n) => {
      if (n.getAttribute('data-featured-track') === '0') return;
      if (n.getAttribute('data-featured-impressed') === '1') return;

      const id = computeIdFromEl(n);
      if (!id) return;

      // ensure attribute exists for consistent click tracking
      if (!n.getAttribute('data-featured-id')) n.setAttribute('data-featured-id', id);

      n.setAttribute('data-featured-impressed', '1');
      post({ id, event: 'impression' });
    });
  }

  function onClick(e) {
    const el = e.target.closest('[data-featured-id], .tkfmFeaturedItem, .tkfm-featured-item, [data-featured-track]');
    if (!el) return;
    if (el.getAttribute('data-featured-track') === '0') return;

    const id = computeIdFromEl(el);
    if (!id) return;

    if (!el.getAttribute('data-featured-id')) el.setAttribute('data-featured-id', id);
    post({ id, event: 'click' });
  }

  function observe() {
    markImpressions();

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length) {
          m.addedNodes.forEach((node) => {
            if (node && node.querySelectorAll) markImpressions(node);
          });
        }
      }
    });

    mo.observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener('click', onClick, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', observe);
  else observe();
})();
