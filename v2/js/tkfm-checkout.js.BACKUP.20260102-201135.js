// TKFM Universal Checkout Binder
// - Any button/link with data-plan="lookup_key" will POST to create-checkout-session
// - Redirects to Stripe Checkout URL
// - Shows visible toast if mapping/env var is missing (so you know what to set in Netlify)

(function(){
  function toast(msg, ok){
    try{
      const el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = `
        <div class="rounded-2xl border ${ok ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100' : 'border-red-500/40 bg-red-500/10 text-red-100'}
          px-4 py-3 text-sm font-semibold shadow-xl backdrop-blur-xl">
          ${String(msg||'')}
        </div>`;
      document.body.appendChild(el);
      setTimeout(()=>{ el.remove(); }, 5200);
    }catch(e){}
  }

  async function go(planId, btn){
    if (!planId) return;
    const busyClass = 'opacity-60 pointer-events-none';
    if (btn) btn.classList.add(...busyClass.split(' '));
    try{
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ planId })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok || !data.ok || !data.url) {
        const err = (data && (data.error || data.message)) ? (data.error || data.message) : 'Checkout failed';
        const hint = (data && data.example) ? (' • ' + data.example) : '';
        toast(`❌ ${err}${hint}`, false);
        return;
      }
      window.location.href = data.url;
    }catch(e){
      toast('❌ Checkout error. Open DevTools → Network for details.', false);
    }finally{
      if (btn) btn.classList.remove(...busyClass.split(' '));
    }
  }

  document.addEventListener('click', (e)=>{
    const t = e.target.closest('[data-plan]');
    if (!t) return;
    const planId = t.getAttribute('data-plan');
    if (!planId) return;
    e.preventDefault();
    go(planId, t);
  });
})();
