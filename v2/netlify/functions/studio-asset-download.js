import { readJson, requestsPath } from "./_tkfm_store_studio.js";

export async function handler(event){
  try{
    const qs = event.queryStringParameters || {};
    const id = String(qs.id || "").trim();
    const type = String(qs.type || "").trim();
    const token = String(qs.token || "").trim();

    if(!id || !type || !token){
      return { statusCode: 400, headers: { "content-type":"text/plain" }, body: "Missing id/type/token" };
    }

    const p = requestsPath();
    const store = readJson(p, { items: [] });
    const item = (store.items || []).find(x => x && x.id === id);
    if(!item || !item.assets || !item.assets[type]){
      return { statusCode: 404, headers: { "content-type":"text/plain" }, body: "Not found" };
    }

    const a = item.assets[type];
    if(String(a.token || "") !== token){
      return { statusCode: 401, headers: { "content-type":"text/plain" }, body: "Bad token" };
    }

    const text = String(a.text || "");
    const filename = `tkfm_${type}_${id}.txt`;

    return {
      statusCode: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`
      },
      body: text
    };
  }catch(e){
    return { statusCode: 500, headers: { "content-type":"text/plain" }, body: e.message };
  }
}
