/* TKFM Featured TV Rotator
   - Renders/controls the top Featured TV player in radio-tv.html
   - Pulls featured media from /.netlify/functions/media-feature-get
   - Auto-rotates on a timer (pause/resume)
   - Targets iframe#featuredTvFrame for playback, with fallback to Open in new tab
*/
(function(){
  const API_BASE = '/.netlify/functions/media-feature-get';
  const ROTATE_SECONDS_DEFAULT = 25;

  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
  function safeJsonParse(s, fallback){ try { return JSON.parse(s); } catch(e){ return fallback; } }

  // Elements expected in radio-tv.html (inserted by our patch script)
  const root = qs('#tkfmFeaturedTV');
  if(!root) return;

  const frame = qs('#featuredTvFrame');
  const titleEl = qs('#featuredTvTitle');
  const metaEl = qs('#featuredTvMeta');
  const btnNext = qs('#featuredTvNext');
  const btnPause = qs('#featuredTvPause');
  const btnOpen = qs('#featuredTvOpen');

  const state = {
    items: [],
    idx: 0,
    timer: null,
    paused: (localStorage.getItem('tkfm_featured_tv_paused') === '1'),
    rotateSeconds: Number(localStorage.getItem('tkfm_featured_tv_rotate_seconds') || ROTATE_SECONDS_DEFAULT) || ROTATE_SECONDS_DEFAULT,
    lastLoadedUrl: ''
  };

  function setPauseUi(){
    if(!btnPause) return;
    btnPause.textContent = state.paused ? 'Resume Rotation' : 'Pause Rotation';
    btnPause.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
  }

  function normalizeItem(raw){
    // Accept flexible shapes from store
    const it = raw || {};
    const title = it.title || it.name || it.displayName || 'Featured';
    const type = (it.type || it.mediaType || it.kind || '').toString().toLowerCase();
    const url = it.url || it.href || it.link || it.src || it.embedUrl || '';
    const thumb = it.thumb || it.thumbnail || it.image || it.cover || '';
    const expiresAt = it.expiresAt || it.expiry || null;
    const disabled = !!(it.disabled || it.isDisabled);
    return { ...it, title, type, url, thumb, expiresAt, disabled };
  }

  function toEmbedUrl(url){
    if(!url) return '';
    const u = url.trim();

    // YouTube (watch / youtu.be)
    const yt1 = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_\-]+)/i);
    if(yt1 && yt1[1]) return `https://www.youtube.com/embed/${yt1[1]}?autoplay=1&rel=0`;

    // Vimeo
    const vm = u.match(/vimeo\.com\/(\d+)/i);
    if(vm && vm[1]) return `https://player.vimeo.com/video/${vm[1]}?autoplay=1`;

    // Spotify (turn track/episode/show to embed)
    if(/open\.spotify\.com\//i.test(u)){
      // Example: https://open.spotify.com/episode/XYZ -> https://open.spotify.com/embed/episode/XYZ
      return u.replace('open.spotify.com/', 'open.spotify.com/embed/') + (u.includes('?') ? '&' : '?') + 'utm_source=tkfm&theme=0';
    }

    // SoundCloud: best effort oEmbed wrapper
    if(/soundcloud\.com\//i.test(u)){
      const encoded = encodeURIComponent(u);
      return `https://w.soundcloud.com/player/?url=${encoded}&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`;
    }

    // Default: use as-is
    return u;
  }

  function pickItemsFromResponse(data){
    // Accept {items:[...]} or array
    const arr = Array.isArray(data) ? data : (data && (data.items || data.data || data.results)) || [];
    return arr.map(normalizeItem).filter(it => !!it.url);
  }

  async function fetchFeatured({ type, shuffle }){
    const params = new URLSearchParams();
    if(type) params.set('type', type);
    params.set('limit', '100');
    if(shuffle) params.set('shuffle', '1');
    // activeOnly defaults to 1 in hardened API, but set explicitly
    params.set('activeOnly', '1');

    const url = `${API_BASE}?${params.toString()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok) throw new Error('feature-get failed');
    const data = await res.json();
    return pickItemsFromResponse(data);
  }

  function renderNowPlaying(it){
    if(titleEl) titleEl.textContent = it ? it.title : 'Featured TV';
    if(metaEl){
      const t = it && (it.type || 'media');
      metaEl.textContent = it ? `${t.toUpperCase()} • Auto-rotates every ${state.rotateSeconds}s` : `Auto-rotates every ${state.rotateSeconds}s`;
    }
  }

  function loadItem(it){
    if(!it) return;
    const embed = toEmbedUrl(it.url);
    state.lastLoadedUrl = it.url;

    renderNowPlaying(it);

    // Load into featured player frame if present
    if(frame){
      frame.src = embed;
      return;
    }

    // If no frame found, just open
    window.open(it.url, '_blank', 'noopener');
  }

  function nextItem(){
    if(!state.items.length) return;
    state.idx = (state.idx + 1) % state.items.length;
    loadItem(state.items[state.idx]);
  }

  function startTimer(){
    stopTimer();
    if(state.paused) return;
    state.timer = setInterval(nextItem, state.rotateSeconds * 1000);
  }

  function stopTimer(){
    if(state.timer){
      clearInterval(state.timer);
      state.timer = null;
    }
  }

  function wireControls(){
    if(btnNext){
      btnNext.addEventListener('click', (e)=>{
        e.preventDefault();
        nextItem();
        startTimer();
      });
    }
    if(btnPause){
      btnPause.addEventListener('click', (e)=>{
        e.preventDefault();
        state.paused = !state.paused;
        localStorage.setItem('tkfm_featured_tv_paused', state.paused ? '1' : '0');
        setPauseUi();
        startTimer();
      });
      setPauseUi();
    }
    if(btnOpen){
      btnOpen.addEventListener('click', (e)=>{
        e.preventDefault();
        const it = state.items[state.idx];
        const url = (it && it.url) ? it.url : state.lastLoadedUrl;
        if(url) window.open(url, '_blank', 'noopener');
      });
    }

    // Bonus: allow a quick speed tweak via console/localStorage
    // localStorage.setItem('tkfm_featured_tv_rotate_seconds', '15'); location.reload()
  }

  async function init(){
    wireControls();

    // Prefer VIDEO/TV type, fallback to untyped if none found.
    let items = [];
    try{
      items = await fetchFeatured({ type: 'video', shuffle: true });
    }catch(e){ /* ignore */ }

    if(!items.length){
      try{
        items = await fetchFeatured({ type: 'tv', shuffle: true });
      }catch(e){ /* ignore */ }
    }

    if(!items.length){
      try{
        items = await fetchFeatured({ type: '', shuffle: true });
      }catch(e){ /* ignore */ }
    }

    state.items = items;
    state.idx = 0;

    if(!state.items.length){
      renderNowPlaying(null);
      if(metaEl) metaEl.textContent = 'No featured media yet.';
      return;
    }

    loadItem(state.items[state.idx]);
    startTimer();
  }

  init();
})();
