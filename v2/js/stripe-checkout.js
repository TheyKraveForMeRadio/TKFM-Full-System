(function(){
  // stripe-checkout.js (patched) — routes to :9999 when Vite has no proxy
  async function startCheckout(planId, opts){
    if(!window.TKFMStartCheckout) throw new Error("TKFMStartCheckout missing");
    return window.TKFMStartCheckout(planId, opts);
  }

  // Back-compat: keep same function name used in stacks
  window.startCheckout = startCheckout;
})();