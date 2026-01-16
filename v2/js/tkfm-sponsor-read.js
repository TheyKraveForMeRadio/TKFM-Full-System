(function(){
  const $ = (id)=>document.getElementById(id);
  const ls = window.localStorage;

  const STATE = {
    customerId: ls.getItem('tkfm_stripe_customer_id') || '',
    credits: 0,
    unlocked: false
  };

  function fnUrl(path){
    const rel = `/.netlify/functions/${path}`;
    const direct = `http://localhost:9999/.netlify/functions/${path}`;
    return { rel, direct };
  }

  async function fetchText(url, opts){
    const res = await fetch(url, opts);
    const txt = await res.text();
    return { res, txt };
  }

  async function fetchJson(path, opts){
    const { rel, direct } = fnUrl(path);
    const o = Object.assign({ headers: { 'content-type': 'application/json' } }, opts||{});

    // Try relative first (works on deploy + when Vite proxy is configured)
    let attempt = [];
    try{
      const a = await fetchText(rel, o);
      attempt.push({ url: rel, status: a.res.status, ok: a.res.ok, txt: a.txt });
      if(a.res.ok) return { data: safeJson(a.txt), used: rel, attempts: attempt };
      // If Vite returns 404 for /.netlify/functions/*, fall through to direct
    }catch(e){
      attempt.push({ url: rel, status: 0, ok: false, txt: String(e && e.message || e) });
    }

    // Direct fallback (your stable local mode)
    const b = await fetchText(direct, o);
    attempt.push({ url: direct, status: b.res.status, ok: b.res.ok, txt: b.txt });
    if(!b.res.ok){
      const d = safeJson(b.txt);
      const msg = (d && (d.error||d.message)) ? (d.error||d.message) : `HTTP ${b.res.status}`;
      const err = new Error(msg);
      err.attempts = attempt;
      throw err;
    }
    return { data: safeJson(b.txt), used: direct, attempts: attempt };
  }

  function safeJson(txt){
    try{ return JSON.parse(txt); }catch(e){ return { ok:false, raw: txt }; }
  }

  function setMsg(kind, text){
    const el = $('msg');
    if(!el) return;
    el.style.display = 'block';
    el.className = 'notice' + (kind==='warn' ? ' warn' : '');
    el.textContent = text;
  }

  function setEnvNote(extra){
    const el = $('envNote');
    if(!el) return;
    const origin = window.location.origin;
    const mode = origin.includes('localhost:5173') ? 'LOCAL (Vite 5173)' : 'DEPLOY';
    el.innerHTML = `Mode: <b>${mode}</b> • Pages on <span class="mono">${origin}</span> • Functions: <span class="mono">/.netlify/functions/*</span> (fallback <span class="mono">localhost:9999</span>)` + (extra ? `<br/><span class="small">${extra}</span>` : '');
  }

  async function refreshCredits(){
    $('custId').textContent = STATE.customerId ? STATE.customerId : '—';
    if(!STATE.customerId){
      $('credits').textContent = '0';
      return;
    }
    const r = await fetchJson('sponsor-credits-get', {
      method:'POST',
      body: JSON.stringify({ customerId: STATE.customerId })
    });
    STATE.credits = r.data.credits || 0;
    $('credits').textContent = String(STATE.credits);
    setEnvNote(`Credits fetched via ${r.used}`);
  }

  async function buy(planId){
    try{
      setMsg('info', 'Creating checkout…');
      // COMPAT: send both keys so it works with either function signature:
      // - { lookup_key: "..." }  OR  { planId: "..." }
      const payload = {
        lookup_key: planId,
        planId: planId,
        // Also include success/cancel overrides (works if your function supports them)
        success_url: `${window.location.origin}/sponsor-success.html?planId=${encodeURIComponent(planId)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/sponsor-cancel.html`
      };

      const r = await fetchJson('create-checkout-session', {
        method:'POST',
        body: JSON.stringify(payload)
      });

      const data = r.data || {};
      const url = data.url || data.checkoutUrl || data.checkout_url || data.redirect_url;
      if(!url){
        setMsg('warn', `Checkout created but no URL returned. Response: ${JSON.stringify(data).slice(0, 500)}`);
        return;
      }
      setEnvNote(`Checkout created via ${r.used}`);
      window.location.href = url;
    }catch(err){
      const attempts = err.attempts ? ` Attempts: ${JSON.stringify(err.attempts).slice(0, 700)}` : '';
      setMsg('warn', `Checkout error: ${err.message}.${attempts}`);
    }
  }

  async function useOneCreditUnlock(){
    if(!STATE.customerId){
      setMsg('warn', 'Missing customer id. Complete checkout success first (sponsor-success.html).');
      return;
    }
    if(STATE.credits <= 0){
      setMsg('warn', 'No credits available. Buy a pack to continue.');
      return;
    }
    try{
      setMsg('info', 'Using 1 credit…');
      const r = await fetchJson('sponsor-credits-use', {
        method:'POST',
        body: JSON.stringify({ customerId: STATE.customerId, amount: 1 })
      });
      STATE.credits = r.data.credits || 0;
      $('credits').textContent = String(STATE.credits);
      STATE.unlocked = true;
      $('formCard').style.display = 'block';
      $('lastStatus').textContent = 'unlocked';
      setMsg('info', `Form unlocked. (credits via ${r.used})`);
      await loadRequests();
    }catch(err){
      setMsg('warn', `Unable to use credit: ${err.message}`);
    }
  }

  async function loadRequests(){
    const rows = $('reqRows');
    if(!rows) return;
    rows.innerHTML = '';
    if(!STATE.customerId) return;
    const r = await fetchJson('sponsor-requests-mine', {
      method:'POST',
      body: JSON.stringify({ customerId: STATE.customerId })
    });
    const list = (r.data.items||[]);
    if(list.length===0){
      rows.innerHTML = `<tr><td colspan="5" class="small">No requests yet.</td></tr>`;
      return;
    }
    for(const item of list){
      const dt = new Date(item.createdAt || item.updatedAt || Date.now());
      const dts = isFinite(dt.getTime()) ? dt.toLocaleString() : '';
      const st = (item.status||'new');
      rows.innerHTML += `<tr>
        <td>${esc(dts)}</td>
        <td>${esc(item.brandName||'')}</td>
        <td>${esc(item.readLength||'')}</td>
        <td><span class="pill">${esc(st)}</span></td>
        <td class="mono">${esc(item.id||'')}</td>
      </tr>`;
    }
  }

  function esc(s){
    return String(s||'').replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  async function submitRequest(){
    if(!STATE.unlocked){
      setMsg('warn', 'Unlock the form by using 1 credit first.');
      return;
    }
    const payload = {
      customerId: STATE.customerId,
      brandName: (($('brandName').value||'').trim()),
      readLength: (($('readLength').value||'30s').trim()),
      cta: (($('cta').value||'').trim()),
      pronounce: (($('pronounce').value||'').trim()),
      script: (($('script').value||'').trim()),
      link: (($('link').value||'').trim())
    };
    if(!payload.brandName || !payload.script){
      setMsg('warn','Brand name and script are required.');
      return;
    }
    try{
      setMsg('info','Submitting request…');
      const r = await fetchJson('sponsor-request-submit', {
        method:'POST',
        body: JSON.stringify(payload)
      });
      $('lastStatus').textContent = r.data.status || 'new';
      STATE.unlocked = false;
      setMsg('info', `Submitted. Request id: ${r.data.id} (via ${r.used})`);
      await loadRequests();
      $('formCard').style.display = 'none';
    }catch(err){
      setMsg('warn', `Submit failed: ${err.message}`);
    }
  }

  function clearForm(){
    ['brandName','cta','pronounce','script','link'].forEach(id=>{ const el=$(id); if(el) el.value=''; });
    const sel = $('readLength'); if(sel) sel.value='30s';
    $('lastStatus').textContent = '—';
    setMsg('info','Cleared.');
  }

  function wire(){
    setEnvNote('');
    document.querySelectorAll('[data-buy]').forEach(btn=>{
      btn.addEventListener('click', ()=>buy(btn.getAttribute('data-buy')));
    });
    $('refreshBtn')?.addEventListener('click', async()=>{
      setMsg('info','Refreshing…');
      await refreshCredits();
      await loadRequests();
      setMsg('info','Updated.');
    });
    $('unlockBtn')?.addEventListener('click', useOneCreditUnlock);
    $('clearBtn')?.addEventListener('click', clearForm);
    $('submitBtn')?.addEventListener('click', submitRequest);
  }

  (async function init(){
    wire();
    try{
      await refreshCredits();
      await loadRequests();
    }catch(e){
      // show something useful
      setEnvNote('If checkout is stuck, confirm functions server is running on :9999 and STRIPE_SECRET_KEY is live.');
    }
  })();
})();