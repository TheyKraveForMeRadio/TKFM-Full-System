import { readStore, writeStore, makeToken, nowIso } from "./_tkfm_store_studio_restore.js";
const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, x-tkfm-owner-key",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json"
};

const TTL_HOURS = 72;

export async function handler(event){
  if(event.httpMethod === "OPTIONS") return { statusCode:200, headers, body:"" };
  if(event.httpMethod !== "POST") return { statusCode:405, headers, body: JSON.stringify({ ok:false, error:"METHOD_NOT_ALLOWED" }) };

  try{
    const body = JSON.parse(event.body || "{}");
    const customerId = String(body.customerId || "").trim();
    const email = String(body.email || "").trim();
    const return_to = String(body.return_to || "").trim();

    if(!customerId) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_CUSTOMER_ID" }) };

    const store = readStore();
    store.tokens = (store.tokens && typeof store.tokens === "object") ? store.tokens : {};

    // prune expired
    const now = Date.now();
    for(const t of Object.keys(store.tokens)){
      const it = store.tokens[t];
      const created = Date.parse(it && it.createdAt ? it.createdAt : "");
      if(!created || (now - created) > TTL_HOURS*3600*1000) delete store.tokens[t];
    }

    const token = makeToken();
    store.tokens[token] = { customerId, email: email || "", createdAt: nowIso(), lastUsedAt: "", uses: 0 };
    writeStore(store);

    const origin = String(body.origin || "").trim() || "https://tkfmradio.com";
    const link = `${origin}/studio-restore.html?t=${encodeURIComponent(token)}&r=${encodeURIComponent(return_to || "/label-studio-hub.html")}`;

    // Optional email via SendGrid (if configured)
    const sgKey = process.env.SENDGRID_API_KEY || "";
    const from = process.env.SENDGRID_FROM_EMAIL || "";
    if(email && sgKey && from){
      const payload = {
        personalizations: [{ to: [{ email }], subject: "TKFM Records — Restore your Studio Wallet" }],
        from: { email: from, name: "TKFM Records" },
        content: [{ type: "text/plain", value: `Restore your Studio Wallet:\n\n${link}\n\nThis link expires in ${TTL_HOURS} hours.` }]
      };
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { "authorization": `Bearer ${sgKey}`, "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const ok = res.status >= 200 && res.status < 300;
      return { statusCode:200, headers, body: JSON.stringify({ ok:true, token, link, emailed: ok }) };
    }

    return { statusCode:200, headers, body: JSON.stringify({ ok:true, token, link, emailed: false }) };
  }catch(e){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error: e.message }) };
  }
}
