function clean(v){
  return String(v||"").trim().replace(/^\uFEFF/, "").replace(/^"+|"+$/g, "");
}

export function isOwner(event){
  const keyHeader =
    event.headers?.["x-tkfm-owner-key"] ||
    event.headers?.["X-Tkfm-Owner-Key"] ||
    event.headers?.["x-tkfm-owner-key".toUpperCase()] ||
    "";
  const auth = event.headers?.authorization || event.headers?.Authorization || "";
  const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : auth;

  const candidate = clean(keyHeader) || clean(bearer);
  const expected = clean(process.env.TKFM_OWNER_KEY || "");
  return !!expected && candidate === expected;
}

export function ownerDeny(){
  return {
    statusCode: 401,
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ok:false, error:"OWNER_ONLY" })
  };
}
