(() => {
  // TKFM: deterministic Featured ID from URL (stable analytics + joins)
  // djb2 hash → base36. Prefix keeps it recognizable.
  function hashDjb2(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) + h) + str.charCodeAt(i);
      h = h >>> 0;
    }
    return h;
  }

  function normUrl(u) {
    const s = String(u || '').trim();
    if (!s) return '';
    return s.replace(/^http:\/\//i, 'https://');
  }

  function featuredIdFromUrl(url) {
    const u = normUrl(url);
    if (!u) return '';
    return 'fm_' + hashDjb2(u).toString(36);
  }

  window.tkfmFeaturedIdFromUrl = featuredIdFromUrl;
})();
