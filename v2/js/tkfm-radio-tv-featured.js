(() => {
  // TKFM: Radio-TV Featured Loader (store-backed)
  // Reads from: /.netlify/functions/featured-media-get
  // Updates common DOM targets if present:
  //  - #tvFrame (iframe) or iframe[data-tkfm-tv="1"]
  //  - #featuredRail or #featuredList or [data-featured-rail="1"]
  //  - [data-featured-item-template="1"] optional
  //
  // Non-breaking: if elements not found, it safely no-ops.

  const ENDPOINT = '/.netlify/functions/featured-media-get';

  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function esc(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function pickTvFrame() {
    return $('#tvFrame') || $('iframe[data-tkfm-tv="1"]') || $('iframe');
  }

  function pickRail() {
    return $('#featuredRail') || $('#featuredList') || $('[data-featured-rail="1"]');
  }

  function inferUrl(url) {
    const u = String(url || '').trim();
    if (!u) return '';
    // If user pasted plain domain without scheme, add https
    if (!/^https?:\/\//i.test(u) && /^[a-z0-9.-]+\.[a-z]{2,}/i.test(u)) return 'https://' + u;
    return u;
  }

  async function fetchFeatured() {
    const res = await fetch(ENDPOINT, { method: 'GET', headers: { 'Accept': 'application/json' } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) return [];
    const items = data.items || data.featured || [];
    return Array.isArray(items) ? items : [];
  }

  function renderRail(rail, items, onSelect) {
    // If page already has its own markup, we won't destroy it unless it looks empty.
    const template = $('[data-featured-item-template="1"]', rail);

    // If there is an explicit template, clone it
    if (template) {
      // keep template hidden
      template.style.display = 'none';
      // clear old clones
      $all('[data-featured-item="1"]', rail).forEach(n => n.remove());

      items.slice(0, 24).forEach((it, idx) => {
        const node = template.cloneNode(true);
        node.removeAttribute('data-featured-item-template');
        node.setAttribute('data-featured-item', '1');
        node.style.display = '';

        const title = it.title || 'Featured';
        const url = inferUrl(it.url);

        // common targets inside node
        const t = $('[data-title="1"]', node) || $('.title', node) || $('strong', node);
        if (t) t.textContent = title;

        const a = $('a', node);
        if (a) {
          a.href = url;
          a.target = '_blank';
          a.rel = 'noreferrer';
        }

        node.addEventListener('click', (e) => {
          e.preventDefault();
          onSelect(it);
        });

        rail.appendChild(node);
      });

      return;
    }

    // Otherwise, we build a simple neon list safely inside rail
    rail.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;gap:10px';

    items.slice(0, 24).forEach((it, idx) => {
      const title = esc(it.title || 'Featured');
      const url = esc(inferUrl(it.url));

      const row = document.createElement('button');
      row.type = 'button';
      row.style.cssText = [
        'text-align:left',
        'width:100%',
        'border-radius:14px',
        'border:1px solid rgba(34,211,238,.20)',
        'background:rgba(255,255,255,.04)',
        'color:rgba(255,255,255,.92)',
        'padding:12px 12px',
        'cursor:pointer'
      ].join(';');

      row.innerHTML = `
        <div style="font-weight:900;letter-spacing:.1px">${title}</div>
        <div style="margin-top:4px;font-size:12px;color:rgba(255,255,255,.65);word-break:break-word">${url}</div>
      `;

      row.addEventListener('click', () => onSelect(it));
      wrap.appendChild(row);
    });

    rail.appendChild(wrap);
  }

  function setTv(tvFrame, item) {
    if (!tvFrame) return;
    const url = inferUrl(item?.url || '');
    if (!url) return;

    // Try common: iframe src
    try {
      tvFrame.src = url;
    } catch (_) {}

    // Also store current featured in localStorage for persistence
    try {
      localStorage.setItem('tkfm_tv_current', JSON.stringify({ title: item.title || '', url, at: Date.now() }));
    } catch (_) {}
  }

  async function boot() {
    const tv = pickTvFrame();
    const rail = pickRail();

    // If nothing to render into, still set tv from last stored item if exists
    if (!tv && !rail) return;

    // restore last featured quickly
    try {
      const last = JSON.parse(localStorage.getItem('tkfm_tv_current') || 'null');
      if (tv && last && last.url) tv.src = inferUrl(last.url);
    } catch (_) {}

    let items = [];
    try {
      items = await fetchFeatured();
    } catch (_) {
      items = [];
    }

    if (!items.length) {
      // no featured items in store; no-op (page may have defaults)
      return;
    }

    // If tv is empty, set first
    if (tv && (!tv.src || tv.src === 'about:blank')) setTv(tv, items[0]);

    if (rail) {
      renderRail(rail, items, (it) => setTv(tv, it));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
