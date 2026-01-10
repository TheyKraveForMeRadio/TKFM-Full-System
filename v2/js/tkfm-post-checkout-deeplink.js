// TKFM Post Checkout DeepLink — auto routes buyer to the right engine + opens Paid Lane modal
// Works even if success_url has no query params (uses sessionStorage.tkfm_last_plan).
(function(){
  function qs(){
    try { return new URLSearchParams(window.location.search || ''); } catch(e){ return new URLSearchParams(); }
  }

  function setStatus(msg){
    const el = document.getElementById('tkfmPostCheckoutStatus');
    if (el) el.textContent = msg;
  }

  function getLastPlan(){
    const q = qs();
    return q.get('lane') || q.get('plan') || q.get('planId') || sessionStorage.getItem('tkfm_last_plan') || '';
  }

  function routeFor(planId){
    const p = String(planId || '').trim();
    if(!p) return { href:'/pricing.html', label:'Pricing' };

    // Direct mappings (most important first)
    const explicit = {
      'video_monthly_visuals': '/video-engine.html',
      'video_music_video_push': '/video-engine.html',
      'video_reels_pack': '/video-engine.html',
      'video_creator_pass_monthly': '/video-engine.html',

      'podcast_monthly_access': '/podcast-engine.html',
      'podcast_interview': '/podcast-engine.html',
      'podcast_live_cast': '/podcast-engine.html',

      'press_run_pack': '/press-engine.html',
      'playlist_pitch_pack': '/press-engine.html',
      'priority_submission_pack': '/press-engine.html',

      'social_starter_monthly': '/social-engine.html',
      'submissions_priority_monthly': '/social-engine.html',

      'ai_dj_autopilot_monthly': '/feature-engine.html',
      'sponsor_autopilot_monthly': '/sponsors.html',
    };

    if (explicit[p]) return { href: explicit[p], label: explicit[p].replace('/','').replace('.html','') };

    // Pattern fallbacks
    if (p.startsWith('video_')) return { href:'/video-engine.html', label:'Video Engine' };
    if (p.startsWith('podcast_')) return { href:'/podcast-engine.html', label:'Podcast Engine' };
    if (p.startsWith('press_')) return { href:'/press-engine.html', label:'Press Engine' };
    if (p.startsWith('social_')) return { href:'/social-engine.html', label:'Social Engine' };
    if (p.startsWith('sponsor_')) return { href:'/sponsors.html', label:'Sponsor Engine' };
    if (p.startsWith('ai_')) return { href:'/feature-engine.html', label:'Feature Engine' };

    return { href:'/pricing.html', label:'Pricing' };
  }

  function buildHref(baseHref, planId){
    const href = String(baseHref || '/pricing.html');
    const isEngine = /\/(video|podcast|press|social)-engine\.html$/i.test(href);
    if (!isEngine) return href;

    const u = new URL(href, window.location.origin);
    u.searchParams.set('submit','1');
    u.searchParams.set('lane', String(planId||''));
    return u.pathname + '?' + u.searchParams.toString();
  }

  const planId = getLastPlan();
  const route = routeFor(planId);
  const dest = buildHref(route.href, planId);

  // Update link if present
  const a = document.getElementById('tkfmPostCheckoutGo');
  if (a) a.setAttribute('href', dest);

  if(planId){
    setStatus('Purchase confirmed. Routing you to your submission form…');
  }else{
    setStatus('Purchase confirmed. Routing…');
  }

  // Short delay so the confirmation page can paint
  setTimeout(function(){
    try { window.location.replace(dest); } catch(e){ window.location.href = dest; }
  }, 650);
})();
