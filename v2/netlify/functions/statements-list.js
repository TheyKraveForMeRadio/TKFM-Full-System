import { loadStore } from "./_tkfm_statements_store.mjs";
import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";

function ownerOk(event){
  const want = process.env.TKFM_OWNER_KEY || process.env.OWNER_KEY || "";
  if(!want) return true;
  const got = (event.headers && (event.headers["x-tkfm-owner-key"] || event.headers["X-TKFM-OWNER-KEY"])) || "";
  return String(got) === String(want);
}

export async function handler(event){
  if(isOptions(event)) return json(200,{ok:true});
  const method=(event.httpMethod||"GET").toUpperCase();
  if(method!=="GET") return bad(405,"GET required");
  if(!ownerOk(event)) return bad(403,"owner_key_required");
  const params=event.queryStringParameters||{};
  const limit=Math.max(1, Math.min(40, parseInt(params.limit||"10",10)||10));
  const store=loadStore();
  const batches=(store.batches||[]).slice(0,limit).map(b=>({ id:b.id, created_at:b.created_at, dsp:b.dsp, period:b.period, stats:b.stats||{ total_lines:(b.rows||[]).length } }));
  return ok({ batches });
}
