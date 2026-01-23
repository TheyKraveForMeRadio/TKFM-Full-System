(function(){
  const $ = (id)=>document.getElementById(id);
  const out = $('out');
  const mode = $('mode');
  const sidEl = $('sid');

  function esc(s){
    return String(s||'').replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }
  function setBox(html, ok){
    out.className = ok ? 'ok' : 'warn';
    out.innerHTML = html;
  }

  function getSessionId(){
    try{
      const u = new URL(location.href);
      return u.searchParams.get('session_id') || u.searchParams.get('sessionId') || '';
    }catch(e){ return ''; }
  }

  function getDraft(){
    try{ return JSON.parse(localStorage.getItem('tkfm_distribution_draft')||'null'); }catch(e){ return null; }
  }

  async function postJSON(url, body){
    const res = await fetch(url, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body) });
    const txt = await res.text();
    let data=null; try{ data=JSON.parse(txt);}catch(e){}
    return { ok: res.ok, status: res.status, text: txt, data };
  }

  async function run(){
    const session_id = getSessionId();
    sidEl.textContent = 'session_id: ' + (session_id ? session_id : '(missing)');
    mode.textContent = 'Mode: auto-create';

    const draft = getDraft();
    if(!draft){
      setBox('<div style="font-weight:950">No draft found.</div><div style="margin-top:6px">Go back to <a href="/distribution-engine.html" style="text-decoration:underline;color:rgba(34,211,238,.95)">Distribution</a> and save a draft first.</div>', false);
      return;
    }

    if(!session_id){
      setBox('<div style="font-weight:950">Missing session_id.</div><div style="margin-top:6px">If you already paid, paste your session_id into the URL: <code>?session_id=...</code></div>', false);
      return;
    }

    setBox('Creating your release request…', true);

    const out1 = await postJSON('/.netlify/functions/distribution-post-checkout', {
      session_id,
      draft
    });

    if(!out1.ok || !out1.data || !out1.data.ok){
      setBox('<div style="font-weight:950">Auto-create failed.</div><pre>'+esc(out1.text)+'</pre>', false);
      return;
    }

    const id = out1.data.id;
    try{ localStorage.setItem('tkfm_distribution_last_id', id); }catch(e){}

    setBox(
      '<div style="font-weight:950">Release request created ✅</div>'+
      '<div style="margin-top:6px">Request ID: <code>'+esc(id)+'</code></div>'+
      '<div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap">'+
        '<a class="btn btnHot" href="/release.html?id='+encodeURIComponent(id)+'" style="text-decoration:none">Open landing</a>'+
        '<a class="btn" href="/client-vault.html" style="text-decoration:none">My Portal</a>'+
        '<a class="btn" href="/distribution-engine.html" style="text-decoration:none">Back</a>'+
      '</div>'+
      '<div style="margin-top:10px;color:rgba(148,163,184,.95);font-size:12px">Owner will update status + DSP links in Owner Distribution Ops.</div>',
      true
    );
  }

  run();
})();