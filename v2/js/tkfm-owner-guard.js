(() => {
  // TKFM Owner Guard (client-side presence check; server endpoints still verify TKFM_OWNER_KEY)
  // Purpose: keep owner-only pages from breaking when key is missing, without hard redirects.
  // Contract:
  //   - Exposes: window.tkfmOwnerKey(), window.tkfmIsOwnerAuthed()
  //   - Sets: window.TKFM_OWNER_GUARD_OK = true once loaded

  function ownerKey() {
    return (
      localStorage.getItem('TKFM_OWNER_KEY') ||
      localStorage.getItem('tkfm_owner_key') ||
      localStorage.getItem('tkfmOwnerKey') ||
      ''
    ).trim();
  }

  function isAuthed() {
    return !!ownerKey();
  }

  window.tkfmOwnerKey = ownerKey;
  window.tkfmIsOwnerAuthed = isAuthed;
  window.TKFM_OWNER_GUARD_OK = true;
})();
