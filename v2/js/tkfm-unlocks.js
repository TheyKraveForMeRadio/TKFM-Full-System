(function(){
  // TKFM Unlocks (NO ES MODULE EXPORTS) — fixes: "Unexpected token 'export'"
  // Stores entitlements in localStorage (per-port). Server entitlements remain via your functions where applicable.
  const LS_KEY = "tkfm_user_features";

  function read(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === "object") ? obj : {};
    }catch(e){
      return {};
    }
  }

  function write(obj){
    localStorage.setItem(LS_KEY, JSON.stringify(obj || {}));
  }

  function has(featureId){
    const f = read();
    return !!f[featureId];
  }

  function enable(featureId, value=true){
    const f = read();
    f[featureId] = value === undefined ? true : value;
    write(f);
    return f;
  }

  function disable(featureId){
    const f = read();
    delete f[featureId];
    write(f);
    return f;
  }

  function merge(unlocks){
    const f = read();
    const u = unlocks && typeof unlocks === "object" ? unlocks : {};
    for(const k of Object.keys(u)){
      f[k] = u[k];
    }
    write(f);
    return f;
  }

  function all(){
    return read();
  }

  // Back-compat globals used across pages
  window.TKFMUnlocks = { has, enable, disable, merge, all, _key: LS_KEY };
  window.tkfmHasUnlock = has;
  window.tkfmEnableUnlock = enable;
})();