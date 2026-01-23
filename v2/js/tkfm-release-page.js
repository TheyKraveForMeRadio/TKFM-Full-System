(function(){
  const $ = (id)=>document.getElementById(id);
  function esc(s){
    return String(s||'').replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function statusLabel(s){
    const map = { submitted:'Submitted', needs_info:'Needs Info', approved:'Approved', scheduled:'Scheduled', published:'Published', rejected:'Rejected' };
    return map[s] || (s ? String(s).replace(/_/g,' ') : 'Submitted');
  }
  function getParam(name){
    const u = new URL(location.href);
    return u.searchParams.get(name) || '';
  }
  async function getJSON(url){
    const res = await fetch(url, { headers: { 'accept':'application/json' } });
    const txt = await res.text();
    let data = null;
    try{ data = JSON.parse(txt); }catch(e){}
    return { ok: res.ok, status: res.status, text: txt, data };
  }
  function buildLinks(links){
    const btn = (href, label, hot)=>{
      if(!href) return '';
      const cls = hot ? 'btn btnHot' : 'btn';
      return '<a class="'+cls+'" href="'+esc(href)+'" target="_blank" rel="noopener">'+esc(label)+'</a>';
    };
    const chunks = [];
    chunks.push(btn(links.spotify, 'Spotify', true));
    chunks.push(btn(links.apple, 'Apple Music', true));
    chunks.push(btn(links.youtube, 'YouTube', false));
    chunks.push(btn(links.other, 'More', false));
    const html = chunks.filter(Boolean).join('');
    return html || '<div class="mini">Links will appear here once published.</div>';
  }
  async function boot(){
    const id = getParam('id') || (function(){ try{return localStorage.getItem('tkfm_distribution_last_id')||'';}catch(e){return '';} })();
    if(!id){
      $('title').textContent = 'Release not found';
      $('subtitle').textContent = 'Missing id. Go to the Distribution page to submit.';
      return;
    }
    const out = await getJSON('/.netlify/functions/distribution-requests-get?id='+encodeURIComponent(id));
    if(!out.ok || !out.data || !out.data.ok){
      $('title').textContent = 'Release not found';
      $('subtitle').textContent = 'Invalid id or not available.';
      return;
    }
    const it = out.data.item || {};
    $('title').textContent = it.project_title || 'Untitled Release';
    $('subtitle').textContent = (it.primary_artist || it.name || 'TKFM') + ' • ' + (it.release_type || 'release').toUpperCase();
    const status = it.status || 'submitted';
    $('statusTag').textContent = statusLabel(status).toUpperCase();
    $('updatedAt').textContent = it.updated_at ? ('Updated: '+String(it.updated_at).slice(0,19).replace('T',' ')) : '';
    const msg = it.client_message ? String(it.client_message).trim() : '';
    $('clientMsg').innerHTML = msg ? ('<div class="mini"><b>Update:</b> '+esc(msg)+'</div>') : '<div class="mini">No updates yet.</div>';
    const assets = Array.isArray(it.asset_urls) ? it.asset_urls : [];
    const coverUrl = it.cover_url || assets.find(u=>/\.(png|jpe?g|webp|gif)(\?|$)/i.test(u)) || '';
    $('cover').innerHTML = coverUrl ? '<img src="'+esc(coverUrl)+'" alt="Cover"/>' : '<div class="mini" style="padding:14px">Cover not added yet.</div>';
    $('links').innerHTML = buildLinks(it.publish_links || {});
    $('tracklist').textContent = it.tracklist || '';
    $('about').innerHTML =
      '<div class="row" style="gap:8px;margin-bottom:8px">'+
        '<span class="tag">'+esc((it.genre||'Genre TBD'))+'</span>'+
        (it.release_date ? ('<span class="tag">Release: '+esc(it.release_date)+'</span>') : '<span class="tag">Release date: TBD</span>')+
      '</div>'+
      '<div class="mini">This project is moving through the TKFM workflow. For upgrades (Radio placement / Featured / Social), visit <a href="/start-here.html" style="text-decoration:underline;color:rgba(34,211,238,.95)">Start Here</a>.</div>';
    try{ document.title = 'TKFM Release — ' + (it.project_title || 'Release'); }catch(e){}
  }
  boot();
})();