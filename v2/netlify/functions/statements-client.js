import { loadStore } from "./_tkfm_statements_store.mjs";
import { loadPayouts } from "./_tkfm_payouts_store.mjs";
import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";

export async function handler(event){
  if(isOptions(event)) return json(200,{ok:true});

  const method = (event.httpMethod||"GET").toUpperCase();
  if(method!=="GET") return bad(405,"GET required");

  const params = event.queryStringParameters || {};
  const email = String(params.email||"").trim().toLowerCase();
  if(!email) return bad(400,"email required");

  const store = loadStore();
  const payouts = loadPayouts();

  const lines = [];
  for(const b of (store.batches||[])){
    for(const r of (b.rows||[])){
      if(String(r.email||"").trim().toLowerCase()===email){
        lines.push({ ...r, batch_id: b.id, batch_created_at: b.created_at });
      }
    }
  }

  let artist_total = 0;
  let tkfm_total = 0;
  for(const l of lines){
    artist_total += Number(l.artist_amount||0);
    tkfm_total += Number(l.tkfm_amount||0);
  }

  const pay = (payouts.items||[]).filter(x => String(x.email||"").toLowerCase()===email);

  let paid = 0;
  let unpaid = 0;
  for(const p of pay){
    if(p.status === "paid") paid += Number(p.amount||0);
    else unpaid += Number(p.amount||0);
  }

  return ok({
    email,
    totals:{
      artist_amount: Number(artist_total.toFixed(2)),
      tkfm_amount: Number(tkfm_total.toFixed(2)),
      paid: Number(paid.toFixed(2)),
      unpaid: Number(unpaid.toFixed(2))
    },
    lines: lines.slice(0,1000),
    payouts: pay.slice(0,500)
  });
}
