/* TKFM Featured Podcast Lane
   - Horizontal rail at top of radio-tv.html
   - Pulls featured podcasts from /.netlify/functions/media-feature-get?type=podcast
   - Click loads into iframe#tvFrame (main TV screen), fallback to open new tab
*/
(function(){
  const API = '/.netlify/functions/media-feature-get?type=podcast&limit=30&activeOnly=1';
  const lane = document.getElementById('tkfmFeaturedPodcastLane');
  if(!lane) return;

  const tvFrame = document.getElementById('tvFrame');

  function el(tag, cls, html){
    const n = document.createElement(tag);
    if(cls) n.className = cls;
    if(html != null) n.innerHTML = html;
    return n;
  }

  function toEmbedUrl(url){
    if(!url) return '';
    const u = url.trim();

    // YouTube
    const yt = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_\-]+)/i);
    if(yt && yt[1]) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`;

    // Spotify
    if(/open\.spotify\.com\//i.test(u)){
      return u.replace('open.spotify.com/', 'open.spotify.com/embed/') + (u.includes('?') ? '&' : '?') + 'utm_source=tkfm&theme=0';
    }

    // SoundCloud
    if(/soundcloud\.com\//i.test(u)){
      const encoded = encodeURIComponent(u);
      return `https://w.soundcloud.com/player/?url=${encoded}&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&visual=true`;
    }

    return u;
  }

  function normalize(raw){
    const it = raw || {};
    return {
      title: it.title || it.name || it.displayName || 'Featured Podcast',
      url: it.url || it.href || it.link || it.src || '',
      thumb: it.thumb || it.thumbnail || it.image || it.cover || '',
      type: (it.type || it.mediaType || 'podcast').toString().toLowerCase()
    };
  }

  async function load(){
    lane.innerHTML = '';
    const wrap = el('div', 'tkfm-featured-podcast-wrap');
    const hdr = el('div', 'tkfm-featured-podcast-hdr',
      `<div class="tkfm-fp-title">Featured Podcasts</div>
       <div class="tkfm-fp-sub">Pinned shows. Click to play inside TV.</div>`
    );
    const rail = el('div', 'tkfm-featured-podcast-rail');
    wrap.appendChild(hdr);
    wrap.appendChild(rail);
    lane.appendChild(wrap);

    let data;
    try{
      const res = await fetch(API, { cache: 'no-store' });
      data = await res.json();
    }catch(e){
      rail.appendChild(el('div','tkfm-fp-empty','Unable to load featured podcasts.'));
      return;
    }

    const items = (Array.isArray(data) ? data : (data.items || data.data || data.results || [])).map(normalize).filter(x=>x.url);
    if(!items.length){
      rail.appendChild(el('div','tkfm-fp-empty','No featured podcasts yet.'));
      return;
    }

    items.forEach((it)=>{
      const card = el('button','tkfm-fp-card');
      card.type = 'button';
      card.innerHTML = `
        <div class="tkfm-fp-thumb" style="${it.thumb ? `background-image:url('${it.thumb}')` : ''}"></div>
        <div class="tkfm-fp-meta">
          <div class="tkfm-fp-name">${escapeHtml(it.title)}</div>
          <div class="tkfm-fp-cta">Play in TV</div>
        </div>
      `;
      card.addEventListener('click', ()=>{
        const embed = toEmbedUrl(it.url);
        if(tvFrame){
          tvFrame.src = embed;
        }else{
          window.open(it.url, '_blank', 'noopener');
        }
      });
      rail.appendChild(card);
    });

    injectStylesOnce();
  }

  function escapeHtml(s){
    return String(s || '').replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function injectStylesOnce(){
    if(document.getElementById('tkfmFeaturedPodcastStyles')) return;
    const style = document.createElement('style');
    style.id = 'tkfmFeaturedPodcastStyles';
    style.textContent = `
      .tkfm-featured-podcast-wrap{margin:14px 0 18px 0;padding:14px 14px;border:1px solid rgba(34,211,238,.18);border-radius:18px;background:linear-gradient(180deg, rgba(2,6,23,.9), rgba(2,6,23,.65));box-shadow:0 0 0 1px rgba(168,85,247,.08), 0 20px 60px rgba(0,0,0,.35);}
      .tkfm-featured-podcast-hdr{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:12px}
      .tkfm-fp-title{font-weight:900;letter-spacing:.3px;font-size:18px;color:#e2e8f0}
      .tkfm-fp-sub{font-size:12px;color:rgba(226,232,240,.75)}
      .tkfm-featured-podcast-rail{display:flex;gap:12px;overflow:auto;padding-bottom:6px}
      .tkfm-fp-card{display:flex;gap:10px;min-width:260px;max-width:320px;text-align:left;border-radius:16px;padding:10px 10px;border:1px solid rgba(236,72,153,.18);background:rgba(2,6,23,.85);cursor:pointer}
      .tkfm-fp-card:hover{border-color:rgba(34,211,238,.45);box-shadow:0 0 0 1px rgba(34,211,238,.15), 0 10px 24px rgba(0,0,0,.35)}
      .tkfm-fp-thumb{width:64px;height:64px;border-radius:14px;background:radial-gradient(circle at 30% 20%, rgba(34,211,238,.35), rgba(168,85,247,.15));background-size:cover;background-position:center;flex:0 0 auto;border:1px solid rgba(168,85,247,.18)}
      .tkfm-fp-meta{display:flex;flex-direction:column;justify-content:center;gap:6px;min-width:0}
      .tkfm-fp-name{font-size:13px;font-weight:800;color:#e2e8f0;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .tkfm-fp-cta{font-size:11px;color:rgba(34,211,238,.9);font-weight:800;letter-spacing:.2px}
      .tkfm-fp-empty{color:rgba(226,232,240,.75);font-size:12px;padding:8px 0}
    `;
    document.head.appendChild(style);
  }

  load();
})();
