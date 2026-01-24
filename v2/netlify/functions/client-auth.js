import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";
import { authEnabled, issueToken } from "./_tkfm_auth.mjs";

function lower(s){ return String(s||"").trim().toLowerCase(); }

export async function handler(event){
  if(isOptions(event)) return json(200,{ok:true});
  const method=(event.httpMethod||"GET").toUpperCase();
  if(method!=="POST") return bad(405,"POST required");

  if(!authEnabled()){
    return bad(500,"auth_not_configured", { need: ["TKFM_JWT_SECRET(or ADMIN_JWT_SECRET)","TKFM_CLIENT_CODE"] });
  }

  let body={};
  try{ body=JSON.parse(event.body||"{}"); }catch(e){ return bad(400,"Invalid JSON"); }

  const email = lower(body.email||"");
  const code = String(body.code||"").trim();
  if(!email) return bad(400,"email required");
  if(!code) return bad(400,"code required");

  const want = process.env.TKFM_CLIENT_CODE || process.env.CLIENT_ACCESS_CODE || "";
  if(code !== want) return bad(403,"invalid_code");

  const token = issueToken(email);
  return ok({ token, email });
}
