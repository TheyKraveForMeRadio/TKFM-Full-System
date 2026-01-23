(function(){
  const $ = (id)=>document.getElementById(id);
  const rowsEl = $('rows');
  const metaEl = $('meta');
  const saveMeta = $('saveMeta');
  let cache = [];
  let selected = null;

  function setMeta(t){ if(metaEl) metaEl.textContent = t; }
  function setSave(t){ if(saveMeta) saveMeta.textContent = t; }

  async function getJSON(url){
    const res = await fetch(url, { headers: { 'accept':'application/json' } });
    const txt = await res.text();
    let data = null;
    try{ data = JSON.parse(txt); }catch(e){}
    return { ok: res.ok, status: res.status, text: txt, data };
  }
  async function postJSON(url, body){
    const res = await fetch(url, {
      method:'POST',
      headers:{'content-type':'application/json'},
      body: JSON.stringify(body)
    });
    const txt = await res.text();
    let data = null;
    try{ data = JSON.parse(txt); }catch(e){}
    return { ok: res.ok, status: res.status, text: txt, data };
  }
  function esc(s){
    return String(s||'').replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function fmtStatus(s){ return String(s||'submitted').replace(/_/g,' ').toUpperCase(); }
  function applyFilters(list){
    const status = $('statusFilter') ? $('statusFilter').value : 'all';
    const q = ($('search') ? $('search').value : '').trim().toLowerCase();
    return list.filter(it=>{
      if(status !== 'all' && (it.status||'submitted') !== status) return false;
      if(!q) return true;
      const blob = [it.id,it.name,it.email,it.project_title,it.primary_artist,it.release_type].join(' ').toLowerCase();
      return blob.includes(q);
    });
  }
  function render(){
    if(!rowsEl) return;
    const list = applyFilters(cache).sort((a,b)=>(b.created_at||'').localeCompare(a.created_at||''));
    rowsEl.innerHTML = list.map(it=>{
      const id = esc(it.id);
      const title = esc(it.project_title||'');
      const type = esc(it.release_type||'');
      const status = esc(it.status||'submitted');
      return (
        '<tr class="tr" data-id="'+id+'">'+
          '<td class="td"><div class="mini"><code>'+id+'</code></div><div class="mini muted">'+esc((it.created_at||'').slice(0,19).replace('T',' '))+'</div></td>'+
          '<td class="td"><div style="font-weight:950">'+esc(it.name||'')+'</div><div class="mini muted">'+esc(it.email||'')+'</div></td>'+
          '<td class="td"><div style="font-weight:950">'+title+'</div><div class="mini muted">'+esc(it.primary_artist||'')+'</div></td>'+
          '<td class="td"><span class="badge">'+type+'</span></td>'+
          '<td class="td"><span class="badge">'+fmtStatus(status)+'</span></td>'+
          '<td class="td"><button class="btn btnHot" type="button" data-open="'+id+'">Open</button></td>'+
        '</tr>'
      );
    }).join('');
    rowsEl.querySelectorAll('button[data-open]').forEach(btn=>{
      btn.addEventListener('click', ()=>openItem(btn.getAttribute('data-open')));
    });
    setMeta('Loaded '+cache.length+' total • showing '+list.length);
  }
  function bindSelectedUI(it){
    selected = it;
    $('selId').value = it.id || '';
    $('selStatus').value = it.status || 'submitted';
    $('ownerNotes').value = it.owner_notes || '';
    $('clientMsg').value = it.client_message || '';
    $('assetsView').value = Array.isArray(it.asset_urls) ? it.asset_urls.join('\n') : '';
    const links = it.publish_links || {};
    $('linkSpotify').value = links.spotify || '';
    $('linkApple').value = links.apple || '';
    $('linkYouTube').value = links.youtube || '';
    $('linkOther').value = links.other || '';
    $('selSummary').innerHTML =
      '<div class="mini"><b>Client:</b> '+esc(it.name||'')+' • '+esc(it.email||'')+'</div>'+
      '<div class="mini"><b>Project:</b> '+esc(it.project_title||'')+' ('+esc(it.release_type||'')+')</div>'+
      '<div class="mini"><b>Release date:</b> '+esc(it.release_date||'')+' • <b>Genre:</b> '+esc(it.genre||'')+'</div>';
    const pub = document.getElementById('openPublic');
    if(pub){ pub.href = '/release.html?id=' + encodeURIComponent(it.id||''); }
    setSave('Selected: '+(it.id||''));
  }
  async function openItem(id){
    setSave('Loading '+id+'…');
    const out = await getJSON('/.netlify/functions/distribution-requests-get?id='+encodeURIComponent(id));
    if(!out.ok || !out.data || !out.data.ok){ setSave('Load failed ('+out.status+').'); return; }
    bindSelectedUI(out.data.item);
  }
  async function refresh(){
    setMeta('Loading…');
    const out = await getJSON('/.netlify/functions/distribution-requests-list?limit=500');
    if(!out.ok || !out.data || !out.data.ok){ setMeta('Load failed ('+out.status+').'); return; }
    cache = out.data.items || [];
    render();
  }
  async function savePatch(patch){
    if(!selected || !selected.id){ setSave('Select an item first.'); return; }
    setSave('Saving…');
    const out = await postJSON('/.netlify/functions/distribution-requests-update', { id: selected.id, patch });
    if(!out.ok || !out.data || !out.data.ok){ setSave('Save failed ('+out.status+').'); return; }
    const updated = out.data.item;
    cache = cache.map(x=>x.id===updated.id?updated:x);
    bindSelectedUI(updated);
    render();
    setSave('Saved ✅');
  }
  async function createTest(){
    setMeta('Creating test item…');
    const out = await postJSON('/.netlify/functions/distribution-requests-submit', {
      name: 'Test Artist',
      email: 'test@tkfm.local',
      role: 'artist',
      release_type: 'single',
      project_title: 'Test Release',
      primary_artist: 'Test Artist',
      genre: 'Hip-Hop',
      release_date: '',
      tracklist: '01 - Test Track',
      asset_urls: ['https://example.com/audio.mp3','https://example.com/cover.jpg'],
      dsp_targets: ['spotify','apple_music'],
      addons: ['radio_add'],
      contract_ack: true
    });
    if(!out.ok || !out.data || !out.data.ok){ setMeta('Test create failed ('+out.status+').'); return; }
    setMeta('Created test item: '+out.data.id);
    await refresh();
    await openItem(out.data.id);
  }
  function copyAssets(){
    const ta = $('assetsView'); if(!ta) return;
    ta.focus(); ta.select(); document.execCommand('copy');
    setSave('Assets copied.');
  }

  if($('refreshBtn')) $('refreshBtn').addEventListener('click', refresh);
  if($('newTestBtn')) $('newTestBtn').addEventListener('click', createTest);
  if($('statusFilter')) $('statusFilter').addEventListener('change', render);
  if($('search')) $('search').addEventListener('input', render);
  if($('saveStatus')) $('saveStatus').addEventListener('click', ()=>savePatch({ status: $('selStatus').value }));
  if($('saveNotes')) $('saveNotes').addEventListener('click', ()=>savePatch({ owner_notes: $('ownerNotes').value }));
  if($('saveClientMsg')) $('saveClientMsg').addEventListener('click', ()=>savePatch({ client_message: $('clientMsg').value }));
  if($('saveLinks')) $('saveLinks').addEventListener('click', ()=>savePatch({
    publish_links: {
      spotify: $('linkSpotify').value.trim(),
      apple: $('linkApple').value.trim(),
      youtube: $('linkYouTube').value.trim(),
      other: $('linkOther').value.trim(),
    }
  }));
  if($('copyAssets')) $('copyAssets').addEventListener('click', copyAssets);

  refresh();
})();