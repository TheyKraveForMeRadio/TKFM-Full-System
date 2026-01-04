(() => {
  // TKFM: Radio-TV Featured Loader (store-backed)
  // Reads from: /.netlify/functions/featured-media-get
  //
  // NEW: respects boostUntil and sorts boosted items first while boost is active.
  // If boostUntil is expired, item behaves normal.

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
    if (!/^https?:\/\//i.test(u) && /^[a-z0-9.-]+\.[a-z]{2,}/i.test(u)) return 'https://' + u;
    return u;
  }

  function parseTime(t) {
    const s = String(t || '').trim();
    if (!s) return 0;
    const ms = Date.parse(s);
    return Number.isFinite(ms) ? ms : 0;
  }

  function isBoostActive(item) {
    const until = parseTime(item.boostUntil);
    if (!until) return false;
    return until > Date.now();
  }

  function sortFeatured(items) {
    // active boosts first; then newest addedAt
    const copy = items.slice();
    copy.sort((a, b) => {
      const ab = isBoostActive(a) ? 1 : 0;
      const bb = isBoostActive(b) ? 1 : 0;
      if (ab !== bb) return bb - ab;
      return parseTime(b.addedAt) - parseTime(a.addedAt);
    });
    return copy;
  }

  async function fetchFeatured() {
    const res = await fetch(ENDPOINT, { method: 'GET', headers: { 'Accept': 'application/json' } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) return [];
    const items = data.items || data.featured || [];
    return Array.isArray(items) ? items : [];
  }

  function renderRail(rail, items, onSelect) {
    const template = $('[data-featured-item-template="1"]', rail);

    if (template) {
      template.style.display = 'none';
      $all('[data-featured-item="1"]', rail).forEach(n => n.remove());

      items.slice(0, 24).forEach((it) => {
        const node = template.cloneNode(true);
        node.removeAttribute('data-featured-item-template');
        node.setAttribute('data-featured-item', '1');
        node.style.display = '';

        const title = it.title || 'Featured';
        const url = inferUrl(it.url);

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

    rail.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:grid;gap:10px';

    items.slice(0, 24).forEach((it) => {
      const title = esc(it.title || 'Featured');
      const url = esc(inferUrl(it.url));
      const boosted = isBoostActive(it);

      const row = document.createElement('button');
      row.type = 'button';
      row.style.cssText = [
        'text-align:left',
        'width:100%',
        'border-radius:14px',
        'border:1px solid rgba(34,211,238,.20)',
        boosted ? 'box-shadow:0 0 0 1px rgba(236,72,153,.25), 0 0 28px rgba(168,85,247,.18)' : '',
        boosted ? 'background:rgba(236,72,153,.08)' : 'background:rgba(255,255,255,.04)',
        'color:rgba(255,255,255,.92)',
        'padding:12px 12px',
        'cursor:pointer'
      ].filter(Boolean).join(';');

      row.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <div style="font-weight:900;letter-spacing:.1px">${title}</div>
          ${boosted ? '<span style="font-size:11px;font-weight:900;border:1px solid rgba(236,72,153,.35);background:rgba(236,72,153,.12);padding:4px 8px;border-radius:999px">BOOST</span>' : ''}
        </div>
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

    try { tvFrame.src = url; } catch (_) {}

    try {
      localStorage.setItem('tkfm_tv_current', JSON.stringify({ title: item.title || '', url, at: Date.now() }));
    } catch (_) {}
  }

  async function boot() {
    const tv = pickTvFrame();
    const rail = pickRail();
    if (!tv && !rail) return;

    try {
      const last = JSON.parse(localStorage.getItem('tkfm_tv_current') || 'null');
      if (tv && last && last.url) tv.src = inferUrl(last.url);
    } catch (_) {}

    let items = [];
    try { items = await fetchFeatured(); } catch (_) { items = []; }
    if (!items.length) return;

    items = sortFeatured(items);

    if (tv && (!tv.src || tv.src === 'about:blank')) setTv(tv, items[0]);
    if (rail) renderRail(rail, items, (it) => setTv(tv, it));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
