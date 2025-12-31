(function () {
  const STORAGE_TOKEN = 'tkfm_owner_token';
  const STORAGE_EXP = 'tkfm_owner_token_exp';

  function nowMs() { return Date.now(); }
  function getToken() { try { return localStorage.getItem(STORAGE_TOKEN) || ''; } catch (e) { return ''; } }
  function getExp() { try { return parseInt(localStorage.getItem(STORAGE_EXP) || '0', 10) || 0; } catch (e) { return 0; } }

  function clearOwner() {
    try {
      localStorage.removeItem(STORAGE_TOKEN);
      localStorage.removeItem(STORAGE_EXP);
    } catch (e) {}
  }

  function setOwner(token, expiresInSeconds) {
    try {
      localStorage.setItem(STORAGE_TOKEN, token);
      localStorage.setItem(STORAGE_EXP, String(nowMs() + (expiresInSeconds * 1000)));
    } catch (e) {}
  }

  function nextUrl() {
    try {
      const path = location.pathname + location.search + location.hash;
      return encodeURIComponent(path);
    } catch (e) {
      return encodeURIComponent('god-view.html');
    }
  }

  function redirectToLogin() {
    location.href = 'owner-login.html?next=' + nextUrl();
  }

  function hasLocalSession() {
    const t = getToken();
    if (!t) return false;
    const exp = getExp();
    if (!exp) return true;
    return exp > nowMs();
  }

  async function verifyWithServer() {
    const t = getToken();
    if (!t) return false;

    try {
      const res = await fetch('/.netlify/functions/owner-verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + t },
        body: JSON.stringify({ ping: true })
      });
      return res.ok;
    } catch (e) {
      return hasLocalSession();
    }
  }

  async function requireOwner() {
    if (!hasLocalSession()) {
      clearOwner();
      redirectToLogin();
      return false;
    }

    const ok = await verifyWithServer();
    if (!ok) {
      clearOwner();
      redirectToLogin();
      return false;
    }

    return true;
  }

  window.TKFM_OWNER_GUARD = {
    getToken,
    clearOwner,
    setOwner,
    hasLocalSession,
    verifyWithServer,
    requireOwner
  };
})();
