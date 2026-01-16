(function(){
  // tkfm-checkout.js (patched) — use shared startCheckout
  async function checkout(planId, opts){
    if(!window.TKFMStartCheckout) throw new Error("TKFMStartCheckout missing");
    return window.TKFMStartCheckout(planId, opts);
  }

  window.tkfmCheckout = checkout;
  window.checkout = checkout;
})();