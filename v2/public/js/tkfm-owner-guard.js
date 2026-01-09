/* TKFM Owner Guard (unified)
   Fixes: "Owner guard missing (js/tkfm-owner-guard.js)"
   Works in: Vite dev (public/), Netlify dist (public copied), and direct dist/js copy.

   Guarantees the following globals:
     window.TKFM_OWNER_GUARD_OK = true
     window.__TKFM_OWNER_GUARD_LOADED = true
     window.tkfmOwnerKey() -> string
     window.tkfmIsOwnerAuthed() -> boolean
     window.TKFM_OWNER_GUARD (helpers)
*/
(() => {
  window.TKFM_OWNER_GUARD_OK = true;
  window.__TKFM_OWNER_GUARD_LOADED = true;

  const now = () => Date.now();

  function safeGet(storage, key) {
    try { return storage.getItem(key); } catch (e) { return null; }
  }

  function readOwnerSession() {
    const ls = window.localStorage;
    const ss = window.sessionStorage;

    const get = (k) => safeGet(ls, k) ?? safeGet(ss, k);

    // support multiple historical key names
    const key =
      get("TKFM_OWNER_KEY") ||
      get("tkfm_owner_key") ||
      get("tkfmOwnerKey") ||
      get("owner_key") ||
      "";

    const email =
      get("OWNER_EMAIL") ||
      get("tkfm_owner_email") ||
      get("tkfmOwnerEmail") ||
      get("owner_email") ||
      "";

    const authed =
      get("tkfm_owner_authed") === "1" ||
      get("tkfm_owner_authed") === "true" ||
      get("tkfmOwnerAuthed") === "1" ||
      get("tkfmOwnerAuthed") === "true" ||
      get("tkfm_owner") === "true" ||
      get("OWNER_AUTHED") === "1";

    const expRaw = get("tkfm_owner_expires_at") || get("tkfmOwnerExpiresAt") || "";
    const expiresAt = expRaw && /^\d+$/.test(expRaw) ? Number(expRaw) : 0;
    const notExpired = !expiresAt || now() < expiresAt;

    // If you store only the key but not an authed flag, treat "key present" as authed.
    const authedByKey = !!key;

    return { authed: (authed || authedByKey) && notExpired, email, key, expiresAt };
  }

  function ownerKey() {
    return readOwnerSession().key || "";
  }

  function isOwnerAuthed() {
    return !!readOwnerSession().authed;
  }

  // Backward-compat function names used by older pages
  window.tkfmOwnerKey = ownerKey;
  window.tkfmIsOwnerAuthed = isOwnerAuthed;

  function renderOwnerLockBanner() {
    const mount = document.getElementById("tkfmOwnerLock");
    if (!mount) return;

    const st = readOwnerSession();
    mount.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.style.cssText = [
      "position: sticky",
      "top: 0",
      "z-index: 9999",
      "padding: 10px 12px",
      "margin: 0",
      "border-radius: 12px",
      "border: 1px solid rgba(34,211,238,0.55)",
      "background: rgba(2,6,23,0.85)",
      "backdrop-filter: blur(8px)",
      "color: rgba(226,232,240,0.95)",
      "font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
      "font-size: 13px",
      "display: flex",
      "align-items: center",
      "justify-content: space-between",
      "gap: 12px"
    ].join(";");

    const left = document.createElement("div");
    left.style.cssText = "display:flex;align-items:center;gap:10px;";

    const dot = document.createElement("span");
    dot.style.cssText = [
      "width:10px","height:10px","border-radius:999px",
      st.authed ? "background:#22d3ee" : "background:#f97316",
      "box-shadow: 0 0 18px rgba(34,211,238,0.45)"
    ].join(";");
    left.appendChild(dot);

    const msg = document.createElement("div");
    msg.textContent = st.authed ? "Owner session: ACTIVE" : "Owner session: NOT ACTIVE (no redirect)";
    left.appendChild(msg);

    const right = document.createElement("div");
    right.style.cssText = "opacity:0.85;";
    right.textContent = st.authed && st.email ? st.email : "Owner tools locked";

    wrap.appendChild(left);
    wrap.appendChild(right);
    mount.appendChild(wrap);
  }

  window.TKFM_OWNER_GUARD = {
    readOwnerSession,
    ownerKey,
    isOwnerAuthed,
    renderOwnerLockBanner,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderOwnerLockBanner);
  } else {
    renderOwnerLockBanner();
  }
})();
