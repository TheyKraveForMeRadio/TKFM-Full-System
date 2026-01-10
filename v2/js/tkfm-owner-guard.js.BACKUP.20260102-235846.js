// TKFM Owner Guard — prevents redirect loops + provides stable owner login flow.
// Stores a minimal owner session in localStorage. Server login is optional.
// Keys used across the project (keep compatibility):
// - tkfm_owner_token
// - tkfm_owner_key
// - TKFM_OWNER_KEY
// - tkfm_owner_authed
// - tkfm_owner_email

(function(){
  const KEYS = [
    'tkfm_owner_token',
    'tkfm_owner_key',
    'TKFM_OWNER_KEY',
    'tkfm_owner_authed',
    'tkfm_owner_email'
  ];

  function getAny(){
    const token = localStorage.getItem('tkfm_owner_token') || '';
    const key = localStorage.getItem('tkfm_owner_key') || localStorage.getItem('TKFM_OWNER_KEY') || '';
    const authed = localStorage.getItem('tkfm_owner_authed') || '';
    const email = localStorage.getItem('tkfm_owner_email') || '';
    return { token: String(token||'').trim(), key: String(key||'').trim(), authed: String(authed||'').trim(), email: String(email||'').trim() };
  }

  function isOwnerLocal(){
    const s = getAny();
    // Support legacy: if a key exists, treat as owner on this device.
    return (s.authed === '1') || !!s.key || !!s.token;
  }

  function clearOwner(){
    try{
      KEYS.forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('tkfm_owner');
      localStorage.removeItem('tkfm_owner_session');
      localStorage.removeItem('tkfm_owner_access');
      localStorage.removeItem('owner_authed');
      localStorage.removeItem('TKFM_OWNER_AUTH');
      localStorage.removeItem('ownerEmail');
    }catch(e){}
  }

  async function tryServerLogin(payload){
    // Optional server auth. If function doesn't exist, caller will fallback.
    const res = await fetch('/.netlify/functions/owner-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });

    // 404 / 405 means function missing or wrong method -> treat as unavailable
    if (res.status === 404 || res.status === 405) {
      const err = new Error('server_unavailable');
      err.code = 'server_unavailable';
      throw err;
    }

    const out = await res.json().catch(()=>({}));
    if (!res.ok || !out || !out.ok) {
      const err = new Error((out && out.error) ? out.error : 'invalid_login');
      err.code = 'invalid_login';
      throw err;
    }
    return out;
  }

  async function login({ email, password, ownerKey } = {}){
    const e = String(email || '').trim().toLowerCase();
    const p = String(password || '').trim();
    const k = String(ownerKey || '').trim();

    // Prefer server validation if available
    try{
      const out = await tryServerLogin({ email: e, password: p, ownerKey: k });
      const token = String(out.token || '').trim() || ('owner_' + Math.random().toString(36).slice(2));
      localStorage.setItem('tkfm_owner_token', token);
      if (k) localStorage.setItem('tkfm_owner_key', k);
      if (k) localStorage.setItem('TKFM_OWNER_KEY', k);
      localStorage.setItem('tkfm_owner_authed', '1');
      if (e) localStorage.setItem('tkfm_owner_email', e);
      return { ok: true, via: 'server', token };
    }catch(err){
      // If server isn't there, fallback to local (device-only) login.
      if (err && err.code === 'server_unavailable'){
        if (!k && !p && !e) return { ok:false, error:'Missing credentials' };
        // Require at least an ownerKey for fallback (strongest local signal)
        if (!k) return { ok:false, error:'Missing owner key' };
        localStorage.setItem('tkfm_owner_key', k);
        localStorage.setItem('TKFM_OWNER_KEY', k);
        localStorage.setItem('tkfm_owner_authed', '1');
        if (e) localStorage.setItem('tkfm_owner_email', e);
        localStorage.setItem('tkfm_owner_token', 'owner_' + Math.random().toString(36).slice(2));
        return { ok: true, via: 'local' };
      }
      return { ok:false, error: (err && err.message) ? err.message : 'Login failed' };
    }
  }

  async function requireOwner(){
    // IMPORTANT: this function NEVER redirects. Pages decide what to do.
    // It only returns a boolean-ish object.
    const ok = isOwnerLocal();
    return { ok, isOwner: ok, allowed: ok };
  }

  window.TKFM_OWNER_GUARD = {
    getAny,
    isOwnerLocal,
    clearOwner,
    login,
    requireOwner
  };
})();
