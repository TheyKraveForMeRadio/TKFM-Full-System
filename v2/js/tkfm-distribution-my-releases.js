(function(){
  if (window.__TKFM_MY_RELEASES) return;
  window.__TKFM_MY_RELEASES = true;

  const host = document.getElementById('tkfmMyReleases');
  if(!host) return;

  const KEY_EMAIL = 'tkfm_distribution_email';
  function esc(s){ return String(s||'').replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  async function getJSON(url){
    const res = await fetch(url, { cache:'no-store' });
    const txt = await res.text();
    let data=null; try{ data=JSON.parse(txt);}catch(e){}
    return { ok: res.ok, status: res.status, text: txt, data };
  }
  function getEmail(){
    let e=''; try{ e = localStorage.getItem(KEY_EMAIL) || ''; }catch(err){}
    return (e||'').trim().toLowerCase();
  }
  function setEmail(e){ try{ localStorage.setItem(KEY_EMAIL, e); }catch(err){} }

  async function load(){
    const email = getEmail();
    const inp = document.getElementById('tkfmReleasesEmail');
    if(inp) inp.value = email;

    if(!email){ host.innerHTML = '<div class="warn">Enter your email to load your releases.</div>'; return; }

    host.innerHTML = '<div class="mini">Loading…</div>';
    const out = await getJSON('/.netlify/functions/distribution-requests-list?email='+encodeURIComponent(email)+'&limit=200');
    if(!out.ok || !out.data || !out.data.ok){ host.innerHTML = '<div class="warn">Load failed.</div>'; return; }

    const items = out.data.items || [];
    if(!items.length){ host.innerHTML = '<div class="mini">No releases found for this email yet.</div>'; return; }

    host.innerHTML = items.slice(0,80).map(it=>{
      const id = esc(it.id);
      const title = esc(it.project_title||'Untitled');
      const status = esc((it.status||'submitted').toUpperCase().replace(/_/g,' '));
      const cs = esc((it.contract_status||'unsigned').toUpperCase());
      const contractUrl = (it.contract_url||'').trim();
      const contractBtn = contractUrl ? ('<a class="btn" href="'+esc(contractUrl)+'" target="_blank" rel="noopener">Contract</a>') : '';
      return (
        '<div class="card2" style="margin-top:10px">'+
          '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center">'+
            '<div><div style="font-weight:950">'+title+'</div><div class="mini">'+esc(it.primary_artist||it.name||'')+'</div></div>'+
            '<div class="row" style="gap:8px;flex-wrap:wrap;justify-content:flex-end">'+
              '<span class="tag">'+cs+'</span><span class="tag">'+status+'</span>'+
              (contractBtn||'')+
              '<a class="btn btnHot" href="/release.html?id='+encodeURIComponent(id)+'" target="_blank" rel="noopener">Open</a>'+
            '</div>'+
          '</div>'+
        '</div>'
      );
    }).join('');
  }

  document.getElementById('tkfmReleasesLoad')?.addEventListener('click', ()=>{
    const inp = document.getElementById('tkfmReleasesEmail');
    const email = (inp?.value || '').trim().toLowerCase();
    setEmail(email);
    load();
  });

  load();
})();