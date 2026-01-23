(function(){
  const $ = (id)=>document.getElementById(id);
  function qsa(sel){ return Array.from(document.querySelectorAll(sel)); }
  function setMeta(msg){ const el=$('submitMeta'); if(el) el.textContent = msg; }
  function showResult(html, ok){
    const el = $('result'); if(!el) return;
    el.style.display='block';
    el.innerHTML = '<div class="'+(ok?'ok':'warn')+'">'+html+'</div>';
  }
  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
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
  function getChecked(cls){
    return qsa('input.'+cls+':checked').map(x=>x.value);
  }
  function normalizeUrls(text){
    return String(text||'')
      .split(/\r?\n/g)
      .map(s=>s.trim())
      .filter(Boolean)
      .slice(0, 50);
  }
  function loadLast(){
    try{
      const last = JSON.parse(localStorage.getItem('tkfm_distribution_last')||'null');
      if(!last) return;
      $('name').value = last.name||'';
      $('email').value = last.email||'';
      $('role').value = last.role||'artist';
      $('releaseType').value = last.releaseType||'single';
      $('projectTitle').value = last.projectTitle||'';
      $('primaryArtist').value = last.primaryArtist||'';
      $('genre').value = last.genre||'';
      $('releaseDate').value = last.releaseDate||'';
      $('tracklist').value = last.tracklist||'';
      $('assetUrls').value = (last.asset_urls||[]).join('\n');
      if(Array.isArray(last.dsp_targets)){
        qsa('input.dsp').forEach(cb=>cb.checked = last.dsp_targets.includes(cb.value));
      }
      if(Array.isArray(last.addons)){
        qsa('input.addon').forEach(cb=>cb.checked = last.addons.includes(cb.value));
      }
      setMeta('Autofilled from last submission.');
    }catch(e){}
  }
  async function submit(){
    const payload = {
      name: $('name').value.trim(),
      email: $('email').value.trim(),
      role: $('role').value,
      release_type: $('releaseType').value,
      project_title: $('projectTitle').value.trim(),
      primary_artist: $('primaryArtist').value.trim(),
      genre: $('genre').value.trim(),
      release_date: $('releaseDate').value,
      tracklist: $('tracklist').value,
      asset_urls: normalizeUrls($('assetUrls').value),
      dsp_targets: getChecked('dsp'),
      addons: getChecked('addon'),
      contract_ack: !!$('contractAck').checked
    };
    if(!payload.name || !payload.email || !payload.project_title){
      showResult('Missing required fields: Name, Email, and Project Title.', false);
      return;
    }
    if(!payload.contract_ack){
      showResult('Contract acknowledgment is required before submission.', false);
      return;
    }
    setMeta('Submitting…');
    showResult('Submitting…', true);
    try{
      const out = await postJSON('/.netlify/functions/distribution-requests-submit', payload);
      if(!out.ok){
        showResult('Submit failed ('+out.status+').<br/><pre class="mini">'+escapeHtml(out.text)+'</pre>', false);
        setMeta('Submit failed.');
        return;
      }
      if(out.data && out.data.ok && out.data.id){
        const id = out.data.id;
        localStorage.setItem('tkfm_distribution_last', JSON.stringify({
          name: payload.name, email: payload.email, role: payload.role,
          releaseType: payload.release_type,
          projectTitle: payload.project_title,
          primaryArtist: payload.primary_artist,
          genre: payload.genre,
          releaseDate: payload.release_date,
          tracklist: payload.tracklist,
          asset_urls: payload.asset_urls,
          dsp_targets: payload.dsp_targets,
          addons: payload.addons
        }));
        localStorage.setItem('tkfm_distribution_last_id', id);
        showResult(
          '<div style="font-weight:950">Submitted ✅</div>'+
          '<div class="mini" style="margin-top:6px">Request ID: <code>'+id+'</code></div>'+
          '<div class="row" style="margin-top:10px;gap:10px;flex-wrap:wrap">'+
            '<a class="btn btnHot" href="/release.html?id='+encodeURIComponent(id)+'" target="_blank" rel="noopener">Open landing page</a>'+
            '<a class="btn" href="/client-vault.html">Go to My Portal</a>'+
          '</div>'+
          '<div class="mini" style="margin-top:10px">Tip: Save this link. Owner will update status + DSP links.</div>',
          true
        );
        setMeta('Submitted. ID: '+id);
        return;
      }
      showResult('Unexpected response.<br/><pre class="mini">'+escapeHtml(out.text)+'</pre>', false);
      setMeta('Unexpected response.');
    }catch(e){
      showResult('Submit error: '+escapeHtml(String(e && e.message ? e.message : e)), false);
      setMeta('Submit error.');
    }
  }

  // Cloudinary unsigned upload helper (optional)
  function openUpload(){
    const m = $('uploadModal'); if(!m) return;
    m.style.display='flex';
    try{
      $('cloudName').value = localStorage.getItem('tkfm_cloud_name') || '';
      $('uploadPreset').value = localStorage.getItem('tkfm_cloud_preset') || '';
    }catch(e){}
  }
  function closeUpload(){
    const m = $('uploadModal'); if(!m) return;
    m.style.display='none';
  }
  async function cloudinaryUpload(files, cloudName, preset){
    const outLinks = [];
    for(const file of files){
      const form = new FormData();
      form.append('file', file);
      form.append('upload_preset', preset);
      const url = 'https://api.cloudinary.com/v1_1/'+encodeURIComponent(cloudName)+'/auto/upload';
      const res = await fetch(url, { method:'POST', body: form });
      const txt = await res.text();
      let data = null;
      try{ data = JSON.parse(txt); }catch(e){}
      if(!res.ok){
        throw new Error('Cloudinary error ('+res.status+'): '+(data && data.error && data.error.message ? data.error.message : txt.slice(0,160)));
      }
      outLinks.push(data.secure_url || data.url || '');
    }
    return outLinks.filter(Boolean);
  }
  async function doUpload(){
    const meta = $('uploadMeta');
    const cloudName = $('cloudName').value.trim();
    const preset = $('uploadPreset').value.trim();
    const files = $('files').files ? Array.from($('files').files) : [];
    if(!cloudName || !preset){ meta.textContent = 'Set Cloud name + Upload preset first.'; return; }
    if(!files.length){ meta.textContent = 'Choose file(s) to upload.'; return; }

    try{
      localStorage.setItem('tkfm_cloud_name', cloudName);
      localStorage.setItem('tkfm_cloud_preset', preset);
    }catch(e){}
    meta.textContent = 'Uploading '+files.length+' file(s)…';
    $('uploadOut').value = '';
    try{
      const links = await cloudinaryUpload(files, cloudName, preset);
      $('uploadOut').value = links.join('\n');
      meta.textContent = 'Uploaded ✅ ('+links.length+' links)';
    }catch(e){
      meta.textContent = 'Upload failed: '+(e && e.message ? e.message : e);
    }
  }
  function copyText(el){
    if(!el) return;
    el.select();
    document.execCommand('copy');
  }

  try{
    const lastId = localStorage.getItem('tkfm_distribution_last_id');
    if(lastId){
      const hint = document.createElement('div');
      hint.className = 'mini';
      hint.innerHTML = 'Last submission: <code>'+lastId+'</code> — <a href="/release.html?id='+encodeURIComponent(lastId)+'" style="text-decoration:underline;color:rgba(34,211,238,.95)">open landing</a>';
      const meta = $('submitMeta');
      if(meta) meta.parentNode.insertBefore(hint, meta.nextSibling);
    }
  }catch(e){}

  if($('submitBtn')) $('submitBtn').addEventListener('click', submit);
  if($('autofillBtn')) $('autofillBtn').addEventListener('click', loadLast);
  if($('uploadHelpBtn')) $('uploadHelpBtn').addEventListener('click', openUpload);
  if($('closeUpload')) $('closeUpload').addEventListener('click', closeUpload);
  if($('uploadGo')) $('uploadGo').addEventListener('click', doUpload);
  if($('copyLinks')) $('copyLinks').addEventListener('click', ()=>copyText($('uploadOut')));

  const modal = $('uploadModal');
  if(modal){
    modal.addEventListener('click', (e)=>{ if(e.target === modal) closeUpload(); });
  }
})();