// TKFM Drops Engine checkout — POST create-checkout-session (lookup_key)
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function normalizeKey(v){
    return String(v || "").trim().replace(/\r/g,"").replace(/\n/g," ").trim().split(/\s+/)[0];
  }

  function setStatus(msg){
    const el = $("#tkfmDropsStatus");
    if (el) el.textContent = msg;
  }

  async function postJSON(url, body){
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { data = null; }
    return { res, data, text };
  }

  function buildUrls(plan){
    const success = new URL(window.location.href);
    success.searchParams.set("unlocked", plan);
    return {
      success_url: success.toString(),
      cancel_url: window.location.href,
    };
  }

  async function startCheckout(plan){
    plan = normalizeKey(plan);
    if (!plan) return;

    setStatus("Creating checkout session for " + plan + " …");

    const urls = buildUrls(plan);
    const payload = { planId: plan, ...urls };

    // Same-origin (works on Netlify + Vite proxy if configured)
    const primary = "/.netlify/functions/create-checkout-session";

    // Local functions server fallback (dist preview / no proxy)
    const fallback = "http://localhost:9999/.netlify/functions/create-checkout-session";

    // Try primary
    try{
      const { res, data, text } = await postJSON(primary, payload);
      if (res.ok && data && data.url){
        window.location.href = data.url;
        return;
      }
      // If preflight/OPTIONS misfires on some setups, treat 405 like missing and try fallback.
      if (res.status !== 404 && res.status !== 405){
        const msg = (data && (data.error || data.message)) ? (data.error || data.message) : ("Checkout failed (" + res.status + ")");
        throw new Error(msg + "\n" + text.slice(0, 300));
      }
    }catch(e){
      console.warn("Primary checkout failed; trying local functions server.", e);
    }

    // Try fallback
    try{
      const { res, data, text } = await postJSON(fallback, payload);
      if (res.ok && data && data.url){
        window.location.href = data.url;
        return;
      }
      const msg = (data && (data.error || data.message)) ? (data.error || data.message) : ("Checkout failed (" + res.status + ")");
      throw new Error(msg + "\n" + text.slice(0, 300));
    }catch(e){
      console.error("Drops checkout failed:", e);
      setStatus("Error: " + (e?.message || String(e)));
      alert("Drops checkout error:\n\n" + (e?.message || String(e)) + "\n\nTip: Start functions on :9999 and open page on :5173 or :7777.");
    }
  }

  function wire(){
    $$("[data-plan]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        startCheckout(btn.getAttribute("data-plan"));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setStatus("Ready. Choose a plan to checkout.");
    wire();
  });
})();
