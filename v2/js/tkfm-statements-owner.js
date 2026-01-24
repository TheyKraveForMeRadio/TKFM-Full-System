(function(){
  const $=(id)=>document.getElementById(id);

  function esc(s){ return String(s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }

  function ownerKey(){ return ($("ownerKey").value||"").trim(); }

  async function postJSON(url, body){
    const key = ownerKey();
    const res = await fetch(url, { method:"POST", headers:{ "content-type":"application/json", ...(key?{"x-tkfm-owner-key":key}:{}) }, body: JSON.stringify(body) });
    const txt = await res.text();
    let data=null; try{ data=JSON.parse(txt);}catch(e){}
    return { ok: res.ok, status: res.status, text: txt, data };
  }
  async function getJSON(url){
    const key = ownerKey();
    const res = await fetch(url, { cache:"no-store", headers: key?{"x-tkfm-owner-key":key}:{} });
    const txt = await res.text();
    let data=null; try{ data=JSON.parse(txt);}catch(e){}
    return { ok: res.ok, status: res.status, text: txt, data };
  }

  function setBox(id, html, ok){
    const el=$(id); if(!el) return;
    el.className = ok ? "ok" : "warn";
    el.innerHTML = html;
  }

  async function importCSV(){
    const out = await postJSON("/.netlify/functions/statements-import", {
      csv: $("csv").value||"",
      dsp: ($("dsp").value||"DSP").trim(),
      period: ($("period").value||"").trim(),
      artist_split: 60,
      tkfm_split: 40
    });
    if(!out.ok || !out.data || !out.data.ok){
      setBox("importOut", "<b>Import failed</b><pre>"+esc(out.text)+"</pre>", false);
      return;
    }
    setBox("importOut", "<b>Imported ✅</b><div style='margin-top:6px'>Batch: <code>"+esc(out.data.batch_id)+"</code></div><div style='margin-top:6px'>Lines: "+esc(out.data.stats.lines)+" • Matched: "+esc(out.data.stats.matched_releases)+" • Payout items: "+esc(out.data.stats.payout_items_created)+"</div>", true);
    loadBatches(); loadPayouts();
  }

  async function loadBatches(){
    const out = await getJSON("/.netlify/functions/statements-list?limit=10");
    if(!out.ok || !out.data || !out.data.ok){ $("batches").textContent="Load failed."; return; }
    const rows = (out.data.batches||[]).map(b=>"<div style='margin-top:8px'><b>"+esc(b.dsp||"DSP")+"</b> • "+esc(b.period||"")+" • <code>"+esc(b.id)+"</code> • lines "+esc((b.stats&&b.stats.total_lines)||0)+"</div>").join("");
    $("batches").innerHTML = rows || "No batches yet.";
  }

  async function loadPayouts(){
    const out = await getJSON("/.netlify/functions/payouts?limit=200");
    if(!out.ok || !out.data || !out.data.ok){ $("payouts").textContent="Load failed."; return; }
    const items = out.data.items || [];
    const rows = items.slice(0,200).map(p=>{
      const st=(p.status||"unpaid").toUpperCase();
      const amt=Number(p.amount||0).toFixed(2);
      const per=esc(p.period||"");
      const dsp=esc(p.dsp||"DSP");
      const rel=esc(p.project_title||p.release_id||"");
      return `<div style="margin-top:8px">
        <span class="pill">${st}</span> <b>$${amt}</b> • ${dsp} • ${per} • ${rel}
        <button class="btn" data-pay="${esc(p.id)}" data-act="mark_paid">Mark Paid</button>
        <button class="btn" data-pay="${esc(p.id)}" data-act="mark_unpaid">Unpay</button>
      </div>`;
    }).join("");
    $("payouts").innerHTML = rows || "No payouts yet.";

    document.querySelectorAll("button[data-pay]").forEach(btn=>{
      btn.addEventListener("click", async ()=>{
        const id=btn.getAttribute("data-pay");
        const act=btn.getAttribute("data-act");
        const note = act==="mark_paid" ? (prompt("Paid note (optional):","")||"") : "";
        const method = act==="mark_paid" ? (prompt("Method (PayPal/ACH):","PayPal")||"") : "";
        await postJSON("/.netlify/functions/payouts", { id, action: act, method, note });
        loadPayouts();
      });
    });
  }

  async function exportPayouts(){
    const out = await getJSON("/.netlify/functions/payouts?limit=5000");
    if(!out.ok || !out.data || !out.data.ok) return;
    const items = out.data.items || [];
    const rows = [["id","status","email","release_id","project_title","dsp","period","currency","amount","paid_at","paid_method","note"]];
    for(const p of items){
      rows.push([p.id,p.status,p.email,p.release_id,p.project_title,p.dsp,p.period,p.currency,p.amount,p.paid_at||"",p.paid_method||"",p.note||""]);
    }
    const csv = rows.map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download="tkfm_payouts_"+new Date().toISOString().replace(/[:.]/g,"-")+".csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  $("importBtn").addEventListener("click", importCSV);
  $("loadBatches").addEventListener("click", loadBatches);
  $("loadPayouts").addEventListener("click", loadPayouts);
  $("exportPayouts").addEventListener("click", exportPayouts);

  loadBatches(); loadPayouts();
})();