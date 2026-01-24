import jwt from "jsonwebtoken";

function getJwtSecret(){
  return process.env.TKFM_JWT_SECRET
    || process.env.ADMIN_JWT_SECRET
    || process.env.JWT_SECRET
    || "";
}

export function authEnabled(){
  const secret = getJwtSecret();
  const code = process.env.TKFM_CLIENT_CODE || process.env.CLIENT_ACCESS_CODE || "";
  return !!(secret && code);
}

export function requireOwner(event){
  const want = process.env.TKFM_OWNER_KEY || process.env.OWNER_KEY || "";
  if(!want) return true;
  const got = (event.headers && (event.headers["x-tkfm-owner-key"] || event.headers["X-TKFM-OWNER-KEY"])) || "";
  return String(got) === String(want);
}

export function verifyBearer(event){
  const secret = getJwtSecret();
  if(!secret) return { ok:false, error:"jwt_secret_missing" };

  const h = (event.headers && (event.headers.authorization || event.headers.Authorization)) || "";
  const m = String(h).match(/^Bearer\s+(.+)$/i);
  if(!m) return { ok:false, error:"missing_bearer" };

  try{
    const payload = jwt.verify(m[1], secret);
    return { ok:true, payload };
  }catch(e){
    return { ok:false, error:"invalid_token", detail:String(e && (e.message||e)) };
  }
}

export function issueToken(email){
  const secret = getJwtSecret();
  const now = Math.floor(Date.now()/1000);
  const exp = now + 60*60*24*30;
  const token = jwt.sign({ email, iat: now, exp }, secret);
  return token;
}

export function emailFromPayload(p){
  return String((p && p.email) || "").trim().toLowerCase();
}
