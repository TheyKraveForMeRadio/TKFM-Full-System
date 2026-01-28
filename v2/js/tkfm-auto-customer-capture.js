// TKFM Auto Customer Capture (UTM + ref tracking)
// Safe to load on any page. Stores latest attribution into localStorage.
// No imports. Works as a plain ES module.
(function () {
  try {
    const url = new URL(window.location.href);
    const p = url.searchParams;

    const keys = [
      "utm_source","utm_medium","utm_campaign","utm_content","utm_term",
      "ref","gclid","fbclid","msclkid"
    ];

    const data = {};
    let hasAny = false;
    for (const k of keys) {
      const v = p.get(k);
      if (v && String(v).trim().length) {
        data[k] = String(v).trim();
        hasAny = true;
      }
    }

    // If no attribution params, still keep a lightweight visit stamp (helps debugging funnels)
    const now = new Date().toISOString();
    const payload = {
      ts: now,
      path: url.pathname || "/",
      host: url.host || "",
      ...data
    };

    // Always expose last visit payload for debugging
    window.TKFM_ATTRIB_LAST = payload;

    // Only persist if we have attribution params OR nothing stored yet
    const lastRaw = localStorage.getItem("tkfm_attrib_last");
    if (hasAny || !lastRaw) {
      localStorage.setItem("tkfm_attrib_last", JSON.stringify(payload));
    }

    // Keep a small rolling log (max 20)
    const logRaw = localStorage.getItem("tkfm_attrib_log");
    let log = [];
    try { log = logRaw ? JSON.parse(logRaw) : []; } catch { log = []; }
    if (!Array.isArray(log)) log = [];
    log.unshift(payload);
    if (log.length > 20) log = log.slice(0, 20);
    localStorage.setItem("tkfm_attrib_log", JSON.stringify(log));
  } catch (e) {
    // never break page
  }
})();