export function getToken(){
  try{ return localStorage.getItem("tkfm_client_token") || ""; }catch(e){ return ""; }
}
export function setToken(t){
  try{ localStorage.setItem("tkfm_client_token", t); }catch(e){}
}
export function getEmail(){
  try{ return (localStorage.getItem("tkfm_distribution_email")||"").trim().toLowerCase(); }catch(e){ return ""; }
}
export function setEmail(e){
  try{ localStorage.setItem("tkfm_distribution_email", (e||"").trim().toLowerCase()); }catch(e){}
}
export async function authLogin(email, code){
  const res = await fetch("/.netlify/functions/client-auth", {
    method:"POST",
    headers:{ "content-type":"application/json" },
    body: JSON.stringify({ email, code })
  });
  const txt = await res.text();
  let data=null; try{ data=JSON.parse(txt);}catch(e){}
  return { ok: res.ok, status: res.status, text: txt, data };
}
export function authHeader(){
  const t = getToken();
  return t ? { "authorization": "Bearer " + t } : {};
}
