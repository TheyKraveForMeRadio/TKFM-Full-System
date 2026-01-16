(function(){
  const $ = (id)=>document.getElementById(id);
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id') || '';
  const planId = params.get('planId') || '';

  $('sess').textContent = sessionId || '—';
  $('plan').textContent = planId || '—';

  function fnUrl(path){
    const rel = `/.netlify/functions/${path}`;
    const direct = `http://localhost:9999/.netlify/functions/${path}`;
    return { rel, direct };
  }

  async function call(path, body){
    const { rel, direct } = fnUrl(path);
    const opts = { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(body||{}) };
    let res = await fetch(rel, opts).catch(()=>null);
    if(!res || res.status===404) res = await fetch(direct, opts);
    const txt = await res.text();
    let data = null;
    try{ data = JSON.parse(txt);}catch(e){ data = { ok:false, raw: txt }; }
    if(!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return data;
  }

  async function run(){
    const status = $('status');
    if(!sessionId){
      status.className = 'notice warn';
      status.textContent = 'Missing session_id. Return to Stripe success URL (it must include session_id).';
      return;
    }
    status.textContent = 'Resolving Stripe customer + awarding credits…';
    try{
      const data = await call('sponsor-award-from-session', { session_id: sessionId, planId });
      if(data.customerId){
        localStorage.setItem('tkfm_stripe_customer_id', data.customerId);
        $('cust').textContent = data.customerId;
      }
      status.className = 'notice';
      status.textContent = `Complete. Credits awarded: ${data.awarded || 0}.`;
    }catch(err){
      status.className = 'notice warn';
      status.textContent = `Error: ${err.message}`;
    }
  }

  run();
})();