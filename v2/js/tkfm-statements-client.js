import { getEmail, setEmail, getToken, setToken, authLogin, authHeader } from "/js/tkfm-secure-client-auth.js";

(function(){
  const $=(id)=>document.getElementById(id);

  function money(n){ const x=Number(n||0); return "$"+x.toFixed(2); }
  function esc(s){ return String(s||"").replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }

  async function getJSON(url){
    const res = await fetch(url, { cache:"no-store", headers: { ...authHeader() } });
    const txt = await res.text();
    let data=null; try{ data=JSON.parse(txt);}catch(e){}
    return { ok: res.ok, status: res.status, text: txt, data };
  }

  function renderPayouts(items){
    if(!items || !items.length) return "No payouts yet.";
    return items.slice(0,50).map(p=>{
      const st=(p.status||"unpaid").toUpperCase();
      const amt=money(p.amount||0);
      const per=esc(p.period||"");
      const dsp=esc(p.dsp||"DSP");
      const rel=esc(p.project_title||p.release_id||"");
      const paidAt=p.paid_at?esc(String(p.paid_at).slice(0,10)):"";
      return `<div style="margin-top:8px"><span class="tag">${st}</span> <b>${amt}</b> • ${dsp} • ${per} • ${rel} ${paidAt?("• paid "+paidAt):""}</div>`;
    }).join("");
  }

  function renderLines(lines){
    if(!lines || !lines.length) return "No statement lines yet.";
    return lines.slice(0,60).map(l=>{
      const title=esc(l.project_title||l.release_id||"");
      const per=esc(l.period||"");
      const dsp=esc(l.dsp||"DSP");
      const cur=esc((l.currency||"usd").toUpperCase());
      const net=money(l.net_amount||0);
      const artist=money(l.artist_amount||0);
      const split=esc(String(l.artist_split||60))+"/"+esc(String(l.tkfm_split||40));
      const fee = Number(l.admin_fee_applied||0) ? (" • Fee "+money(l.admin_fee_applied)) : "";
      return `<div style="margin-top:8px"><b>${title}</b><div style="opacity:.85">${dsp} • ${per} • ${cur} • Net ${net} • Artist ${artist} • Split ${split}${fee}</div></div>`;
    }).join("");
  }

  async function ensureAuth(email){
    if(getToken()) return true;
    const code = prompt("Enter TKFM Access Code to view statements:", "");
    if(!code) return false;
    const out = await authLogin(email, code);
    if(!out.ok || !out.data || !out.data.ok){
      $("lines").innerHTML = "<div class='warn'><b>Auth failed</b><pre>"+esc(out.text)+"</pre></div>";
      return false;
    }
    setToken(out.data.token);
    return true;
  }

  async function load(){
    const email=($("email").value||"").trim().toLowerCase();
    if(!email) return;
    setEmail(email);

    if(!(await ensureAuth(email))) return;

    const out=await getJSON("/.netlify/functions/statements-client?email="+encodeURIComponent(email));
    if(!out.ok || !out.data || !out.data.ok){
      $("lines").innerHTML="<div class='warn'><b>Load failed</b><pre>"+esc(out.text)+"</pre></div>";
      return;
    }

    const t=out.data.totals||{};
    $("tArtist").textContent="Artist: "+money(t.artist_amount||0);
    $("tPaid").textContent="Paid: "+money(t.paid||0);
    $("tUnpaid").textContent="Unpaid: "+money(t.unpaid||0);
    $("tTKFM").textContent="TKFM: "+money(t.tkfm_amount||0);

    $("payouts").innerHTML=renderPayouts(out.data.payouts||[]);
    $("lines").innerHTML=renderLines(out.data.lines||[]);
  }

  $("loadBtn").addEventListener("click", load);

  const e=getEmail();
  if(e) $("email").value=e;
})();