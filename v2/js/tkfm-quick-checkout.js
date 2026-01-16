(function(){
  // TKFM Quick Checkout — 5173 safe
  // Fix: Vite 5173 returns 404 for /.netlify/functions/* unless proxied.
  // This uses window.TKFMCallFn fallback to localhost:9999.
  const $ = (sel)=>document.querySelector(sel);

  function setMsg(text){
    const el = document.getElementById("tkfmCheckoutMsg");
    if(el) el.textContent = text;
    // also console
    console.log("[TKFM checkout]", text);
  }

  async function startCheckout(planIdOrLookupKey, extra){
    try{
      if(!window.TKFMCallFn) throw new Error("TKFMCallFn missing. Include /js/tkfm-functions-client.js first.");
      const id = String(planIdOrLookupKey || "").trim();
      if(!id) throw new Error("Missing plan id / lookup_key");

      const payload = Object.assign({
        lookup_key: id,
        planId: id
      }, extra || {});

      setMsg("Creating checkout…");

      const r = await window.TKFMCallFn("create-checkout-session", payload);
      const data = r.data || {};
      const url = data.url || data.checkoutUrl || data.checkout_url || data.redirect_url;
      if(!url){
        throw new Error("No checkout URL returned");
      }
      setMsg(`Redirecting to Stripe… (${r.used})`);
      window.location.href = url;
    }catch(err){
      const attempts = err.attempts ? JSON.stringify(err.attempts) : "";
      console.error("TKFM checkout error", err);
      setMsg(`Checkout error: ${err.message} ${attempts}`);
      return null;
    }
  }

  // Auto-wire buttons
  function wire(){
    const btns = document.querySelectorAll("[data-plan],[data-lookup-key],[data-buy]");
    btns.forEach(btn=>{
      btn.addEventListener("click", (e)=>{
        e.preventDefault();
        const id = btn.getAttribute("data-plan") || btn.getAttribute("data-lookup-key") || btn.getAttribute("data-buy");
        startCheckout(id);
      });
    });
  }

  // Back-compat global used by other scripts
  window.startCheckout = startCheckout;
  window.TKFMStartCheckout = startCheckout;

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", wire);
  }else{
    wire();
  }
})();