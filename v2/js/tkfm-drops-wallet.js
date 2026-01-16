// TKFM Drops Wallet + History (Server-backed credits, local fallback)
(() => {
  const LS_CREDITS = "tkfm_drops_credits";
  const LS_HISTORY = "tkfm_drops_history";
  const LS_PLAN = "tkfm_drops_plan";
  const LS_CUSTOMER = "tkfm_stripe_customer_id";

  const PLAN_CREDITS = {
    ai_drops_starter_monthly: 20,
    ai_drops_pro_monthly: 60,
    ai_drops_studio_monthly: 200,
    drop_pack_10: 10,
    drop_pack_25: 25,
    drop_pack_100: 100,
    radio_imaging_bundle: 40,
  };

  function getCreditsLocal(){
    const n = parseInt(localStorage.getItem(LS_CREDITS) || "0", 10);
    return Number.isFinite(n) ? n : 0;
  }
  function setCreditsLocal(n){
    localStorage.setItem(LS_CREDITS, String(Math.max(0, n|0)));
  }

  function getCustomerId(){
    const c = (localStorage.getItem(LS_CUSTOMER) || "").trim();
    return c || null;
  }

  async function serverGetCredits(){
    const customerId = getCustomerId();
    if (!customerId) return null;
    try{
      const r = await fetch(`/.netlify/functions/drops-credits-get?customerId=${encodeURIComponent(customerId)}`, { method: "GET", credentials: "same-origin" });
      if (!r.ok) return null;
      const data = await r.json().catch(()=>null);
      if (data && data.ok && typeof data.credits === "number") return data.credits|0;
      return null;
    }catch(_){
      return null;
    }
  }

  async function serverUseCredit(){
    const customerId = getCustomerId();
    if (!customerId) return null;
    try{
      const r = await fetch("/.netlify/functions/drops-credits-use", {
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ customerId, amount: 1 }),
        credentials:"same-origin"
      });
      const data = await r.json().catch(()=>null);
      if (r.ok && data && data.ok && typeof data.credits === "number") return data.credits|0;
      return null;
    }catch(_){
      return null;
    }
  }

  function getHistory(){
    try { return JSON.parse(localStorage.getItem(LS_HISTORY) || "[]") || []; }
    catch { return []; }
  }
  function setHistory(h){
    localStorage.setItem(LS_HISTORY, JSON.stringify((h || []).slice(0, 50)));
  }
  function pushHistory(item){
    const h = getHistory();
    h.unshift(item);
    setHistory(h);
    render();
  }

  function qs(k){
    return new URL(window.location.href).searchParams.get(k);
  }

  function esc(s){
    return String(s||"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#39;");
  }

  function setCreditsUI(n){
    const creditsEl = document.getElementById("tkfmDropsCredits");
    if (creditsEl) creditsEl.textContent = String(n|0);
  }

  function renderHistory(){
    const histEl = document.getElementById("tkfmDropsHistory");
    if (!histEl) return;
    const h = getHistory();
    if (!h.length){
      histEl.innerHTML = '<div style="color:#94a3b8;font-size:12px">No history yet. Your generated scripts will show here.</div>';
      return;
    }
    histEl.innerHTML = h.map(x => `
      <div style="border:1px solid rgba(148,163,184,.18);background:rgba(255,255,255,.03);border-radius:14px;padding:10px;margin-top:10px">
        <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div style="font-weight:900">${esc(x.title||"Drop")}</div>
          <div style="color:#94a3b8;font-size:12px">${esc(x.ts||"")}</div>
        </div>
        <pre style="white-space:pre-wrap;word-break:break-word;margin:8px 0 0;color:#e5e7eb;font-size:12px;line-height:1.5">${esc(x.body||"")}</pre>
      </div>
    `).join("");
  }

  async function render(){
    // Prefer server credits if customerId is known
    const serverCredits = await serverGetCredits();
    if (serverCredits !== null){
      setCreditsLocal(serverCredits);
      setCreditsUI(serverCredits);
    } else {
      setCreditsUI(getCreditsLocal());
    }
    renderHistory();
  }

  function applyUnlockLocalFallback(){
    const unlocked = qs("unlocked");
    if (!unlocked) return;
    const plan = String(unlocked).trim();
    localStorage.setItem(LS_PLAN, plan);
    const add = PLAN_CREDITS[plan] || 0;
    if (add > 0) setCreditsLocal(getCreditsLocal() + add);

    const u = new URL(window.location.href);
    u.searchParams.delete("unlocked");
    window.history.replaceState({}, "", u.toString());
  }

  function wireGenerator(){
    const name = document.getElementById("tkfmDropName");
    const vibe = document.getElementById("tkfmDropVibe");
    const type = document.getElementById("tkfmDropType");
    const out = document.getElementById("tkfmDropOut");

    const gen = document.getElementById("tkfmDropGen");
    const save = document.getElementById("tkfmDropSave");
    const use = document.getElementById("tkfmDropUse1");
    const clear = document.getElementById("tkfmDropClearHistory");

    if (!gen) return;

    gen.addEventListener("click", () => {
      const dj = (name?.value || "").trim() || "DJ";
      const vb = (vibe?.value || "").trim() || "clean";
      const tp = (type?.value || "tag").trim();

      const script = tp === "sponsor"
        ? `Sponsor Read (${vb})\n\nThis hour is powered by ${dj}. Tap in now on TKFM Radio — the Independent Artist Power Station.`
        : tp === "id"
          ? `Station ID (${vb})\n\nYou’re locked in to TKFM Radio — the Independent Artist Power Station.`
          : `DJ Tag (${vb})\n\n${dj}… you’re now in the mix.`;

      if (out) out.value = script;
    });

    save.addEventListener("click", () => {
      const body = (out?.value || "").trim();
      if (!body) return alert("Generate a script first.");
      const title = ((type?.value || "Drop").toUpperCase()) + " — " + ((name?.value || "DJ").trim() || "DJ");
      pushHistory({ title, body, ts: new Date().toLocaleString() });
      alert("Saved to history.");
    });

    use.addEventListener("click", async () => {
      // try server first, fallback local
      const serverCredits = await serverUseCredit();
      if (serverCredits !== null){
        await render();
        alert("1 credit used. Remaining: " + serverCredits);
        return;
      }
      const local = getCreditsLocal();
      if (local <= 0) return alert("No credits left. Buy a top-up or upgrade.");
      setCreditsLocal(local - 1);
      await render();
      alert("1 credit used. Remaining: " + (local - 1));
    });

    if (clear){
      clear.addEventListener("click", () => {
        if (!confirm("Clear drop history?")) return;
        setHistory([]);
        render();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", async () => {
    applyUnlockLocalFallback();
    wireGenerator();
    await render();
  });
})();
