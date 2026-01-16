(function(){
  const $ = (id)=>document.getElementById(id);
  const ls = window.localStorage;
  const KEY_LS = 'tkfm_owner_key';

  function fnUrl(path){
    const rel = `/.netlify/functions/${path}`;
    const direct = `http://localhost:9999/.netlify/functions/${path}`;
    return { rel, direct };
  }

  async function fetchJson(path, body, ownerKey){
    const { rel, direct } = fnUrl(path);
    const headers = { 'content-type':'application/json' };
    if(ownerKey) headers['x-tkfm-owner-key'] = ownerKey;
    const opts = { method:'POST', headers, body: JSON.stringify(body||{}) };

    let res = await fetch(rel, opts).catch(()=>null);
    if(!res || res.status===404) res = await fetch(direct, opts);
    const txt = await res.text();
    let data = null;
    try{ data = JSON.parse(txt);}catch(e){ data = { ok:false, raw: txt }; }
    if(!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return data;
  }

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function msg(kind, text){
    const el = $('msg');
    el.style.display = 'block';
    el.className = 'notice' + (kind==='warn' ? ' warn' : '');
    el.textContent = text;
  }

  async function load(){
    const ownerKey = ls.getItem(KEY_LS) || '';
    $('ownerKey').value = ownerKey;
    const rows = $('rows');
    rows.innerHTML = '';
    if(!ownerKey){
      msg('warn','Missing owner key. Paste + Save first.');
      return;
    }
    msg('info','Loading…');
    try{
      const data = await fetchJson('sponsor-request-list', {}, ownerKey);
      const list = (data.items||[]);
      if(list.length===0){
        rows.innerHTML = `<tr><td colspan="6" class="small">No requests.</td></tr>`;
      }else{
        for(const r of list){
          const dt = new Date(r.createdAt || r.updatedAt || Date.now());
          const dts = isFinite(dt.getTime()) ? dt.toLocaleString() : '';
          const st = (r.status||'new');
          rows.innerHTML += `<tr data-id="${escapeHtml(r.id||'')}">
            <td>${escapeHtml(dts)}</td>
            <td><span class="pill">${escapeHtml(st)}</span></td>
            <td>${escapeHtml(r.brandName||'')}</td>
            <td>${escapeHtml(r.readLength||'')}</td>
            <td class="mono">${escapeHtml(r.customerId||'')}</td>
            <td class="mono">${escapeHtml(r.id||'')}</td>
          </tr>`;
        }
      }
      msg('info',`Loaded ${list.length} requests.`);
    }catch(err){
      msg('warn', `Load error: ${err.message}`);
    }
  }

  function wireRowClicks(){
    $('rows').addEventListener('click', async(e)=>{
      const tr = e.target.closest('tr[data-id]');
      if(!tr) return;
      const id = tr.getAttribute('data-id');
      $('reqId').value = id;
      const ownerKey = ls.getItem(KEY_LS) || '';
      if(!ownerKey) return;
      try{
        const data = await fetchJson('sponsor-request-get', { id }, ownerKey);
        $('statusSel').value = data.status || 'new';
        $('sched').value = data.scheduledDate || '';
        $('notes').value = data.ownerNotes || '';
        msg('info', `Selected ${id}`);
      }catch(err){
        msg('warn', `Get error: ${err.message}`);
      }
    });
  }

  async function update(){
    const ownerKey = ls.getItem(KEY_LS) || '';
    const id = $('reqId').value.trim();
    if(!ownerKey){ msg('warn','Missing owner key.'); return; }
    if(!id){ msg('warn','Select a request first.'); return; }
    const payload = {
      id,
      status: $('statusSel').value,
      scheduledDate: $('sched').value.trim(),
      ownerNotes: $('notes').value.trim()
    };
    try{
      msg('info','Updating…');
      await fetchJson('sponsor-request-update', payload, ownerKey);
      msg('info','Updated.');
      await load();
    }catch(err){
      msg('warn', `Update error: ${err.message}`);
    }
  }

  function wire(){
    $('saveKey').addEventListener('click', ()=>{
      const v = ($('ownerKey').value||'').trim();
      if(v) ls.setItem(KEY_LS, v);
      msg('info','Saved owner key for this port.');
      load();
    });
    $('clearKey').addEventListener('click', ()=>{
      ls.removeItem(KEY_LS);
      $('ownerKey').value = '';
      msg('info','Cleared.');
    });
    $('refresh').addEventListener('click', load);
    $('update').addEventListener('click', update);
    wireRowClicks();
  }

  wire();
  load();
})();