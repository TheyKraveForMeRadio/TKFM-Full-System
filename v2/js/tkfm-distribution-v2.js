(function(){
  const $ = (id)=>document.getElementById(id);
  const KEY = "tkfm_distribution_draft";

  function setMeta(t){ const el=$('draftMeta'); if(el) el.textContent = t; }

  function getDraft(){
    return {
      name: ($('name').value||'').trim(),
      email: ($('email').value||'').trim(),
      role: $('role').value || 'artist',
      release_type: $('releaseType').value || 'single',
      project_title: ($('projectTitle').value||'').trim(),
      primary_artist: ($('primaryArtist').value||'').trim(),
      genre: ($('genre').value||'').trim(),
      release_date: ($('releaseDate').value||'').trim(),
      tracklist: $('tracklist').value || '',
      asset_urls: String($('assetUrls').value||'').split(/\r?\n/g).map(s=>s.trim()).filter(Boolean).slice(0,50),
      contract_ack: !!$('contractAck').checked
    };
  }

  function saveDraft(){
    const d = getDraft();
    if(!d.name || !d.email || !d.project_title){
      setMeta('Fill Name, Email, Project Title before saving.');
      return;
    }
    try{
      localStorage.setItem(KEY, JSON.stringify({ ...d, saved_at: new Date().toISOString() }));
      localStorage.setItem('tkfm_distribution_email', d.email);
      setMeta('Draft saved ✅');
    }catch(e){
      setMeta('Draft save failed.');
    }
  }

  function loadDraft(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw){ setMeta('No draft found.'); return; }
      const d = JSON.parse(raw);
      $('name').value = d.name||'';
      $('email').value = d.email||'';
      $('role').value = d.role||'artist';
      $('releaseType').value = d.release_type||'single';
      $('projectTitle').value = d.project_title||'';
      $('primaryArtist').value = d.primary_artist||'';
      $('genre').value = d.genre||'';
      $('releaseDate').value = d.release_date||'';
      $('tracklist').value = d.tracklist||'';
      $('assetUrls').value = Array.isArray(d.asset_urls) ? d.asset_urls.join('\n') : '';
      $('contractAck').checked = !!d.contract_ack;
      setMeta('Draft loaded ✅');
    }catch(e){
      setMeta('Draft load failed.');
    }
  }

  // Auto-load draft if present
  loadDraft();

  if($('saveDraftBtn')) $('saveDraftBtn').addEventListener('click', saveDraft);
  if($('autofillBtn')) $('autofillBtn').addEventListener('click', loadDraft);
})();