(function(){
  const KEY_PRIMARY = "TKFM_OWNER_KEY";
  const KEY_SESSION = "tkfm_owner_session";
  const KEY_EMAIL = "tkfm_owner_email";

  function getToken(){
    return (localStorage.getItem(KEY_PRIMARY) || localStorage.getItem(KEY_SESSION) || "").trim();
  }

  function isOwner(){
    const t = getToken();
    return !!(t && t.length >= 8);
  }

  function setOwner(token, email){
    const t = (token || "owner").trim();
    localStorage.setItem(KEY_PRIMARY, t);
    localStorage.setItem(KEY_SESSION, t);
    if (email) localStorage.setItem(KEY_EMAIL, String(email).toLowerCase().trim());
  }

  function clearOwner(){
    localStorage.removeItem(KEY_PRIMARY);
    localStorage.removeItem(KEY_SESSION);
    localStorage.removeItem(KEY_EMAIL);
  }

  function nextUrl(fallback){
    try{
      const u = new URL(location.href);
      const n = u.searchParams.get("next");
      if (!n) return fallback || "/owner-dashboard.html";
      if (n.startsWith("http")) return fallback || "/owner-dashboard.html";
      if (!n.startsWith("/")) return "/" + n;
      return n;
    }catch(e){
      return fallback || "/owner-dashboard.html";
    }
  }

  window.TKFM_OWNER = { isOwner, getToken, setOwner, clearOwner, nextUrl };
})();
