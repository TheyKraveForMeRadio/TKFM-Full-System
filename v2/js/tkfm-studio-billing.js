(function(){
  // TKFM Label Studio Billing Portal Button
  // Adds a "Manage Billing" button to label-studio-hub.html without rewriting the whole file.
  const BTN_ID = "tkfmStudioManageBillingBtn";

  function ensureBtn(){
    if(document.getElementById(BTN_ID)) return;

    // Try to find the first button row in the page header area
    const host = document.querySelector(".card .pad .row") || document.querySelector(".row") || null;
    if(!host) return;

    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.className = "btn ghost";
    btn.textContent = "Manage Billing";
    btn.addEventListener("click", async()=>{
      try{
        const cid = localStorage.getItem("tkfm_stripe_customer_id") || "";
        if(!cid) return alert("Missing customer id. Complete a purchase first (success page sets it).");
        if(!window.TKFMCallFn) return alert("TKFMCallFn missing. Ensure tkfm-functions-client.js is loaded.");

        // Create billing portal session
        const r = await window.TKFMCallFn("studio-portal-session", {
          customerId: cid,
          return_url: `${window.location.origin}/label-studio-hub.html`
        });

        const data = r.data || {};
        const url = data.url;
        if(!url) return alert("No portal URL returned.");
        window.location.href = url;
      }catch(e){
        alert("Billing error: " + (e && e.message ? e.message : String(e)));
      }
    });

    host.appendChild(btn);
  }

  function init(){
    // Run after DOM ready
    ensureBtn();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  }else{
    init();
  }
})();