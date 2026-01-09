/* TKFM Owner Guard (safe sync)
   - Normalizes legacy owner auth keys in localStorage so old gates stop blinking/breaking.
   - Does NOT redirect.
   - Sets window.__TKFM_OWNER_GUARD_LOADED = true
*/
(function () {
  try { window.__TKFM_OWNER_GUARD_LOADED = true; } catch(e) {}

  const KEYS_TRUE = [
    "tkfm_owner_authed",
    "owner_authed",
    "TKFM_OWNER_AUTH",
    "tkfm_owner_access",
    "tkfm_owner_session"
  ];

  const KEYS_TOKEN = [
    "tkfm_owner_token",
    "tkfm_owner_key",
    "TKFM_OWNER_KEY"
  ];

  const EMAIL_KEYS = [
    "ownerEmail",
    "tkfm_owner_email"
  ];

  function get(key) { try { return localStorage.getItem(key); } catch(e) { return null; } }
  function set(key, val) { try { localStorage.setItem(key, val); } catch(e) {} }

  const existingToken = KEYS_TOKEN.map(get).find(v => v && String(v).trim());
  if (existingToken) {
    KEYS_TOKEN.forEach(k => set(k, existingToken));
    KEYS_TRUE.forEach(k => set(k, "true"));
  }

  const anyAuthed = KEYS_TRUE.map(get).some(v => String(v).toLowerCase() === "true" || v === "1");
  if (anyAuthed) KEYS_TRUE.forEach(k => set(k, "true"));

  const ownerJsonKey = "tkfm_owner";
  let ownerObj = null;
  try {
    const raw = get(ownerJsonKey);
    if (raw) ownerObj = JSON.parse(raw);
  } catch(e) {}

  if (ownerObj && typeof ownerObj === "object") {
    const em = ownerObj.email || ownerObj.ownerEmail || ownerObj.owner_email;
    if (em) EMAIL_KEYS.forEach(k => set(k, String(em)));
    const ok = ownerObj.key || ownerObj.ownerKey || ownerObj.owner_key;
    if (ok) {
      KEYS_TOKEN.forEach(k => set(k, String(ok)));
      KEYS_TRUE.forEach(k => set(k, "true"));
    }
  }

  const existingEmail = EMAIL_KEYS.map(get).find(v => v && String(v).trim());
  if (existingEmail) EMAIL_KEYS.forEach(k => set(k, existingEmail));

  try {
    const wKey = window.TKFM_OWNER_KEY || window.__TKFM_OWNER_KEY || "";
    if (wKey && String(wKey).trim()) {
      KEYS_TOKEN.forEach(k => set(k, String(wKey)));
      KEYS_TRUE.forEach(k => set(k, "true"));
    }
  } catch(e) {}
})();
