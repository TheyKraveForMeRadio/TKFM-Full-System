// TKFM Drop / Tag Engine — client-only script builder + Stripe checkout wiring (lookup_key based)
(function(){
  const UNLOCK_LS_KEY = "tkfm_user_features";

  const ENTITLEMENTS = [
    "ai_drops_starter_monthly",
    "ai_drops_pro_monthly",
    "ai_drops_studio_monthly",
    "drop_pack_10",
    "drop_pack_25",
    "drop_pack_100",
    "radio_imaging_bundle",
    "custom_voice_setup",
    "custom_voice_hosting_monthly"
  ];

  function normalizeKey(v){
    return String(v || "").trim().replace(/^["']+|["']+$/g, "");
  }

  function getFeatures(){
    try{
      const raw = localStorage.getItem(UNLOCK_LS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.map(normalizeKey) : [];
    }catch(e){
      return [];
    }
  }

  function setFeatures(next){
    const uniq = Array.from(new Set(next.map(normalizeKey).filter(Boolean)));
    localStorage.setItem(UNLOCK_LS_KEY, JSON.stringify(uniq));
    return uniq;
  }

  function addFeature(f){
    const cur = getFeatures();
    if (!cur.includes(f)) cur.push(f);
    return setFeatures(cur);
  }

  function hasAccess(){
    const cur = getFeatures();
    return cur.some(x => ENTITLEMENTS.includes(x));
  }

  function setAccessUI(){
    const text = document.getElementById("accessText");
    const pill = document.getElementById("accessPill");
    const ok = hasAccess();
    if (text) text.textContent = ok ? "Access: Unlocked" : "Access: Locked (purchase a plan)";
    if (pill){
      pill.className = "pill " + (ok ? "ok" : "lock");
      pill.textContent = ok ? "Unlocked" : "Locked";
    }
  }

  function qs(name){
    const u = new URL(window.location.href);
    return u.searchParams.get(name);
  }

  function handleUnlockedQuery(){
    const unlocked = normalizeKey(qs("unlocked"));
    if (unlocked){
      addFeature(unlocked);
      // clean URL (remove unlocked param) to avoid re-adding forever
      const u = new URL(window.location.href);
      u.searchParams.delete("unlocked");
      window.history.replaceState({}, "", u.toString());
    }
  }

  // Try to use go-checkout (preferred). If it returns JSON, we’ll redirect from the JSON.
  async function startCheckout(plan){
    plan = normalizeKey(plan);
    if (!plan) return;

    const successUrl = window.location.origin + window.location.pathname + "?unlocked=" + encodeURIComponent(plan);
    const cancelUrl = window.location.href;

    // Attempt 1: open go-checkout (most TKFM pages use this)
    // Use same-window navigation so Stripe redirects work without CORS issues.
    // If go-checkout ignores params, it still should redirect to Stripe based on plan.
    try{
      const url = "/.netlify/functions/go-checkout?plan=" + encodeURIComponent(plan) +
                  "&success=" + encodeURIComponent(successUrl) +
                  "&cancel=" + encodeURIComponent(cancelUrl);
      window.location.href = url;
      return;
    }catch(e){
      // fall through
    }
  }

  function vibeWords(style){
    switch(style){
      case "hype": return ["world premiere","turn it up","exclusive","takeover","we lit","no breaks"];
      case "lux": return ["platinum","executive","signature sound","TKFM Records","gold standard","exclusive"];
      case "dark": return ["midnight","after-hours","neon shadow","late night","zone","no sleep"];
      case "sports": return ["stadium","arena","game time","on the mic","crowd","energy"];
      case "podcast": return ["welcome back","new episode","tap in","subscribe","powered by","story time"];
      default: return ["official","now playing","tap in","powered by TKFM","exclusive","radio ready"];
    }
  }

  function buildScripts(name, style, cta, energyList, len){
    const base = (name || "TKFM").trim();
    const ctaLine = (cta || "Tap in now").trim();
    const energy = (energyList || []).filter(Boolean);
    const vib = vibeWords(style);
    const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)];
    const sprinkle = ()=> {
      const a = [...vib, ...energy];
      return a.length ? pick(a) : pick(vib);
    };

    const templates = [];
    templates.push(`${base}… ${sprinkle()}. ${ctaLine}.`);
    templates.push(`You’re locked in with ${base}. ${sprinkle()}. ${ctaLine}.`);
    templates.push(`${base} on the mix… ${sprinkle()} — ${ctaLine}.`);
    templates.push(`This is ${base}. ${sprinkle()}. Don’t move. ${ctaLine}.`);
    templates.push(`${sprinkle()}… It’s ${base}. ${ctaLine}.`);

    if (len === "short"){
      return templates.map(t => t.split(" ").slice(0, 10).join(" ")).slice(0, 4);
    }
    if (len === "long"){
      return templates.map(t => t + " " + `TKFM Radio — The Independent Artist Power Station.`).slice(0, 6);
    }
    return templates.slice(0, 5);
  }

  function init(){
    handleUnlockedQuery();
    setAccessUI();

    // Bind purchase buttons
    document.querySelectorAll("[data-plan]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        const plan = btn.getAttribute("data-plan");
        startCheckout(plan);
      });
    });

    const btnGen = document.getElementById("btnGenerate");
    const btnCopy = document.getElementById("btnCopy");
    const btnUnlockHelp = document.getElementById("btnUnlockHelp");
    const out = document.getElementById("out");

    if (btnGen && out){
      btnGen.addEventListener("click", ()=>{
        const name = (document.getElementById("name")||{}).value || "";
        const style = (document.getElementById("style")||{}).value || "clean";
        const cta = (document.getElementById("cta")||{}).value || "";
        const energy = (document.getElementById("energy")||{}).value || "";
        const len = (document.getElementById("length")||{}).value || "medium";
        const energyList = energy.split(",").map(s=>s.trim()).filter(Boolean);

        const scripts = buildScripts(name, style, cta, energyList, len);
        out.value = scripts.map((s,i)=>`${i+1}) ${s}`).join("\n\n");
      });
    }

    if (btnCopy && out){
      btnCopy.addEventListener("click", async ()=>{
        try{
          await navigator.clipboard.writeText(out.value || "");
          btnCopy.textContent = "Copied";
          setTimeout(()=>btnCopy.textContent="Copy", 900);
        }catch(e){
          out.focus();
          out.select();
          document.execCommand("copy");
        }
      });
    }

    if (btnUnlockHelp){
      btnUnlockHelp.addEventListener("click", ()=>{
        // If user already purchased, they can manually unlock by adding ?unlocked=lookup_key
        // We’ll prompt them for the lookup_key and store it locally.
        const v = normalizeKey(prompt("Paste your lookup_key (example: ai_drops_pro_monthly)"));
        if (!v) return;
        addFeature(v);
        setAccessUI();
        alert("Unlocked locally. If you want this to be automatic, complete checkout and land back here with ?unlocked=" + v);
      });
    }
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
