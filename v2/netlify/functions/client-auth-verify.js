import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";
import { authEnabled, verifyBearer, emailFromPayload } from "./_tkfm_auth.mjs";

export async function handler(event){
  if(isOptions(event)) return json(200,{ok:true});
  const method=(event.httpMethod||"GET").toUpperCase();
  if(method!=="GET") return bad(405,"GET required");

  if(!authEnabled()){
    return ok({ enabled:false });
  }

  const v = verifyBearer(event);
  if(!v.ok) return bad(401, v.error, { detail: v.detail || "" });

  return ok({ enabled:true, email: emailFromPayload(v.payload) });
}
