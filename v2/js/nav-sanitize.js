// TKFM Nav Sanitize (public pages)
// - Removes obvious owner/dev links from nav areas
// - Renames "Login" copy to "Member Sign In" where possible
// Safe to include on any public page.

(function(){
  const badHrefs = [
    'god-view.html',
    'tkfm-dev-console.html',
    'owner-ops-dashboard.html',
    'owner-login.html'
  ];

  function killLink(a){
    a.style.display = 'none';
    a.setAttribute('aria-hidden','true');
  }

  document.querySelectorAll('a[href]').forEach(a => {
    const href = (a.getAttribute('href') || '').trim();
    const text = (a.textContent || '').trim().toLowerCase();

    if(badHrefs.some(b => href.includes(b))) killLink(a);

    // Remove any "owner" link labels if present
    if(text.includes('owner') || text.includes('god view') || text.includes('dev console') || text.includes('ops dashboard')){
      killLink(a);
    }

    // Rename login copy (keeps href intact)
    if(text === 'login' || text === 'sign in' || text === 'login • sign up'){
      a.textContent = 'Member Sign In';
    }
  });
})();
