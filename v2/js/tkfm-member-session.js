(function(){
  const STORE_USERS = 'tkfm_members';
  const STORE_SESSION = 'tkfm_member_session';
  const STORE_PROFILE = 'tkfm_member_profile';
  const STORE_TIER = 'tkfm_memberTier';

  function now(){ return Date.now(); }
  function read(k, d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } }
  function write(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }

  function normEmail(s){ return String(s||'').trim().toLowerCase(); }

  function getUsers(){ return read(STORE_USERS, []); }
  function setUsers(u){ write(STORE_USERS, u); }

  function setTier(tier){
    try{ localStorage.setItem(STORE_TIER, tier); }catch(e){}
  }

  function setProfile(p){
    write(STORE_PROFILE, p);
  }

  function setSession(s){
    write(STORE_SESSION, s);
  }

  function clearSession(){
    try{
      localStorage.removeItem(STORE_SESSION);
    }catch(e){}
  }

  function tierLabel(t){
    switch(String(t||'free')){
      case 'fan': return 'Fan Pass';
      case 'creator': return 'Creator';
      case 'dj': return 'DJ';
      case 'label': return 'Label';
      default: return 'Free';
    }
  }

  async function sha256(str){
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function register({displayName,email,password,tier}){
    const em = normEmail(email);
    if(!displayName || displayName.trim().length < 2) return { ok:false, error:'Display name is required.' };
    if(!em || !em.includes('@')) return { ok:false, error:'Valid email is required.' };
    if(!password || password.length < 6) return { ok:false, error:'Password must be at least 6 characters.' };

    const users = getUsers();
    if(users.find(u=>u.email === em)) return { ok:false, error:'Account already exists. Sign in instead.' };

    const passHash = await sha256(password);
    const id = 'm_' + Math.random().toString(16).slice(2) + '_' + Date.now();

    const account = {
      id,
      email: em,
      passHash,
      createdAt: now(),
      tierRequested: String(tier||'free'),
      tierActive: 'free', // paid tiers activate after purchase/approval
      approvedLabel: false
    };

    users.push(account);
    setUsers(users);

    const profile = {
      id,
      displayName: displayName.trim(),
      email: em,
      badge: (String(tier||'free') === 'fan') ? 'FAN' : '',
      createdAt: now()
    };

    setProfile(profile);
    setTier('free');
    setSession({ id, email: em, signedInAt: now() });

    return { ok:true, account, profile };
  }

  async function login({email,password}){
    const em = normEmail(email);
    if(!em || !em.includes('@')) return { ok:false, error:'Valid email is required.' };
    if(!password) return { ok:false, error:'Password is required.' };

    const users = getUsers();
    const u = users.find(x=>x.email === em);
    if(!u) return { ok:false, error:'Account not found. Create an account first.' };

    const passHash = await sha256(password);
    if(passHash !== u.passHash) return { ok:false, error:'Incorrect password.' };

    setSession({ id: u.id, email: em, signedInAt: now() });

    // Determine active tier (label requires approved + active)
    let activeTier = String(u.tierActive || 'free');
    if(activeTier === 'label' && !u.approvedLabel) activeTier = 'free';
    setTier(activeTier);

    // Make sure profile exists
    const p = read(STORE_PROFILE, null);
    if(!p || p.email !== em){
      setProfile({ id: u.id, displayName: (p && p.displayName) ? p.displayName : 'Member', email: em, createdAt: now() });
    }

    return { ok:true, tier: activeTier, tierLabel: tierLabel(activeTier) };
  }

  function logout(){
    clearSession();
    try{ localStorage.removeItem(STORE_TIER); }catch(e){}
    return { ok:true };
  }

  function isSignedIn(){
    const s = read(STORE_SESSION, null);
    return !!(s && s.id && s.email);
  }

  function getTier(){
    try{ return localStorage.getItem(STORE_TIER) || 'free'; } catch(e){ return 'free'; }
  }

  function getProfile(){
    return read(STORE_PROFILE, null);
  }

  // Wire up forms if present
  function wireLogin(){
    const form = document.getElementById('form');
    if(!form) return;
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const ok = document.getElementById('ok');
    const err = document.getElementById('err');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');

    function show(el, msg){ if(!el) return; el.textContent = msg; el.style.display = 'block'; }
    function hide(el){ if(!el) return; el.textContent = ''; el.style.display = 'none'; }

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      hide(ok); hide(err);
      if(loginBtn){ loginBtn.disabled = true; loginBtn.textContent = 'Signing in…'; }
      try{
        const res = await login({ email: email.value, password: password.value });
        if(!res.ok) throw new Error(res.error || 'Sign in failed');
        show(ok, 'Signed in. Active tier: ' + res.tierLabel + '. Redirecting…');
        setTimeout(function(){ location.href = 'app-hub.html'; }, 400);
      }catch(ex){
        show(err, String(ex && ex.message ? ex.message : ex));
      }finally{
        if(loginBtn){ loginBtn.disabled = false; loginBtn.textContent = 'Sign In'; }
      }
    });

    if(logoutBtn){
      logoutBtn.addEventListener('click', function(){
        logout();
        hide(err);
        show(ok, 'Signed out.');
      });
    }
  }

  function wireRegister(){
    const form = document.getElementById('form');
    if(!form) return;
    const displayName = document.getElementById('displayName');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const password2 = document.getElementById('password2');
    const tier = document.getElementById('tier');
    const ok = document.getElementById('ok');
    const err = document.getElementById('err');
    const createBtn = document.getElementById('createBtn');

    function show(el, msg){ if(!el) return; el.textContent = msg; el.style.display = 'block'; }
    function hide(el){ if(!el) return; el.textContent = ''; el.style.display = 'none'; }

    form.addEventListener('submit', async function(e){
      e.preventDefault();
      hide(ok); hide(err);

      const pw = (password && password.value) ? password.value : '';
      const pw2 = (password2 && password2.value) ? password2.value : '';
      if(pw !== pw2){
        show(err, 'Passwords do not match.');
        return;
      }

      if(createBtn){ createBtn.disabled = true; createBtn.textContent = 'Creating…'; }
      try{
        const res = await register({
          displayName: (displayName && displayName.value) ? displayName.value : '',
          email: (email && email.value) ? email.value : '',
          password: pw,
          tier: (tier && tier.value) ? tier.value : 'free'
        });
        if(!res.ok) throw new Error(res.error || 'Create account failed');

        // Save the requested tier so pricing pages can upsell
        try{ localStorage.setItem('tkfm_memberTierRequested', String((tier && tier.value) ? tier.value : 'free')); }catch(e){}

        show(ok, 'Account created. Active tier: Free. Redirecting…');
        setTimeout(function(){ location.href = 'app-hub.html'; }, 450);
      }catch(ex){
        show(err, String(ex && ex.message ? ex.message : ex));
      }finally{
        if(createBtn){ createBtn.disabled = false; createBtn.textContent = 'Create Account'; }
      }
    });
  }

  // Export a tiny API for other pages (optional)
  window.TKFM_MEMBER = {
    isSignedIn,
    getTier,
    getProfile,
    tierLabel,
    login,
    register,
    logout
  };

  wireLogin();
  wireRegister();
})();