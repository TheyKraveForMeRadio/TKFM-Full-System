(function(){
  const ID = "tkfmStudioRecoveryPanel";
  function createPanel(){
    if(document.getElementById(ID)) return;
    const host = document.querySelector(".card .pad") || document.body;
    const div = document.createElement("div");
    div.id = ID;
    div.style.marginTop = "12px";
    div.innerHTML = `
      <div class="hr"></div>
      <div class="kicker">🔑 Recover Wallet</div>
      <div class="small">If you lost your customerId (port changed / cleared storage), paste your recovery code.</div>
      <div class="row" style="margin-top:10px;align-items:flex-end">
        <div style="flex:1;min-width:260px">
          <label style="display:block;font-size:12px;color:rgba(255,255,255,0.70);margin:0 0 6px">Recovery Code</label>
          <input id="tkfmRecoveryCodeInput" placeholder="ABCD-EFGH-IJKL-MNOP" style="width:100%;padding:10px 12px;border-radius:12px;border:1px solid rgba(250,204,21,0.22);background:rgba(2,6,23,0.55);color:rgba(255,255,255,0.92)" />
        </div>
        <button id="tkfmRecoveryClaimBtn" class="btn">Recover</button>
      </div>
      <div id="tkfmRecoveryMsg" class="notice" style="display:none;margin-top:10px"></div>
    `;
    host.appendChild(div);

    const msg = (kind, text)=>{
      const el = document.getElementById("tkfmRecoveryMsg");
      el.style.display = "block";
      el.className = "notice" + (kind==="warn" ? " warn" : "");
      el.textContent = text;
    };

    async function callFn(name, payload){
      if(!window.TKFMCallFn) throw new Error("TKFMCallFn missing");
      const r = await window.TKFMCallFn(name, payload);
      return r.data || {};
    }

    document.getElementById("tkfmRecoveryClaimBtn").addEventListener("click", async()=>{
      const code = (document.getElementById("tkfmRecoveryCodeInput").value||"").trim();
      if(!code) return msg("warn","Paste a recovery code.");
      try{
        msg("info","Recovering…");
        const data = await callFn("studio-recovery-claim", { code });
        if(!data.customerId) throw new Error("No customerId returned");
        localStorage.setItem("tkfm_stripe_customer_id", data.customerId);
        msg("info", "Recovered customerId. Reloading…");
        setTimeout(()=>window.location.reload(), 700);
      }catch(e){
        msg("warn", e.message || String(e));
      }
    });
  }

  function init(){
    // Show panel only if missing customerId
    const cid = localStorage.getItem("tkfm_stripe_customer_id") || "";
    if(!cid) createPanel();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();