/* TKFM QUICK CHECKOUT (patched): loads /tkfm-price-map.json to avoid Netlify env bloat */
let __tkfmPriceMap = null;
async function __tkfmLoadPriceMap(){
  if (__tkfmPriceMap) return __tkfmPriceMap;
  try {
    const r = await fetch('/tkfm-price-map.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('map http '+r.status);
    __tkfmPriceMap = await r.json();
  } catch (e) {
    __tkfmPriceMap = null;
  }
  return __tkfmPriceMap;
}
// TKFM Quick Checkout (sitewide) — stable delegated handler
// - Works with ANY element containing data-plan or data-feature
// - Stores last selected plan in sessionStorage so post-checkout can auto-route
// - Redirects to Stripe Checkout URL returned by /.netlify/functions/create-checkout-session
(function(){
  if (window.__TKFM_QUICK_CHECKOUT_V2__) return;
  window.__TKFM_QUICK_CHECKOUT_V2__ = true;

  function toast(msg){
    try{
      let t = document.querySelector('.toast');
      if(!t){
        t = document.createElement('div');
        t.className = 'toast';
        t.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:22px;z-index:9999;max-width:92vw;';
        document.body.appendChild(t);
      }
      t.innerHTML = '<div style="background:rgba(2,6,23,.85);border:1px solid rgba(34,211,238,.25);padding:10px 12px;border-radius:14px;color:#e2e8f0;font:600 12px system-ui,Segoe UI,Roboto,sans-serif;">'+
        String(msg).replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]))+
      '</div>';
      clearTimeout(window.__TKFM_TOAST_T__);
      window.__TKFM_TOAST_T__ = setTimeout(()=>{ if(t) t.innerHTML=''; }, 3200);
    }catch(e){}
  }

  async function startCheckout(planId, meta){
    if(!planId) return;
    try{
      sessionStorage.setItem('tkfm_last_plan', planId);
      if (meta && typeof meta === 'object') {
        sessionStorage.setItem('tkfm_last_meta', JSON.stringify(meta));
      }

      toast('Opening secure checkout…');
      const res = await fetch('/.netlify/functions/create-checkout-session', {
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify({ planId, ...meta })
      });
      const j = await res.json().catch(()=>null);
      if(!j || !j.ok || !j.url){
        toast((j && (j.error || j.message)) ? (j.error || j.message) : 'Checkout error. Please try again.');
        console.error('TKFM checkout error', j);
        return;
      }
      window.location.href = j.url;
    }catch(err){
      toast('Checkout failed. Please try again.');
      console.error(err);
    }
  }

  function resolvePlanFromEl(el){
    if(!el) return null;
    return el.getAttribute('data-plan') || el.getAttribute('data-feature') || el.dataset.plan || el.dataset.feature || null;
  }

  // Delegate clicks anywhere
  document.addEventListener('click', function(e){
    const target = e.target && e.target.closest ? e.target.closest('[data-plan],[data-feature],.js-checkout') : null;
    if(!target) return;

    const planId = resolvePlanFromEl(target);
    if(!planId) return; // allow other click handlers if no plan

    // Prevent default nav if this is a link/button meant to checkout
    e.preventDefault();

    // Optional meta: allow page to set return path or lane hint
    const meta = {};
    try{
      // Where the user clicked from (helps post-checkout)
      meta.from = window.location.pathname || '';
    }catch(_){}

    startCheckout(planId, meta);
  }, true);

  // Expose manual call if needed
  window.tkfmStartCheckout = startCheckout;
})();
