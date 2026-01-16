import { readJson, writeJson, requestsPath, nowIso } from "./_tkfm_store_studio.js";
import { isOwner, ownerDeny } from "./_tkfm_owner_check.js";

const headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, x-tkfm-owner-key",
  "access-control-allow-methods": "POST, OPTIONS",
  "content-type": "application/json"
};

function makeToken(){
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function pick(obj, key){
  return String((obj && obj[key]) || "").trim();
}

function safe(s){ return String(s||"").trim(); }

function buildText(type, item){
  const p = item.profile || {};
  const name = safe(p.name) || safe(item.artist) || "Artist";
  const genre = safe(p.genre) || "Independent";
  const ig = safe(p.ig);
  const link = safe(p.link);
  const city = safe(p.city);
  const project = safe(item.artist) || "New Release";
  const notes = safe(item.notes);

  if(type === "press_release"){
    return [
      `${name} Announces ${project}`,
      ``,
      `${city ? city + " — " : ""}${name} (${genre}) releases ${project}.`,
      ``,
      `About:`,
      `${name} is an independent ${genre} artist/producer${city ? " from " + city : ""}.`,
      `${ig ? "Instagram: " + ig : ""}`,
      `${link ? "Link: " + link : ""}`,
      ``,
      `Release Notes:`,
      notes || "(add notes)",
      ``,
      `Contact:`,
      `${safe(p.email) || "(email)"}`
    ].join("\n");
  }

  if(type === "radio_pitch_email"){
    return [
      `Subject: TKFM Records Submission — ${name} — ${project}`,
      ``,
      `Hey TKFM Team,`,
      ``,
      `Submitting ${project} for consideration. Genre: ${genre}.`,
      `${city ? "City: " + city : ""}`,
      `${ig ? "IG: " + ig : ""}`,
      `${link ? "Link: " + link : ""}`,
      ``,
      `Notes / Story:`,
      notes || "(add notes)",
      ``,
      `Thank you,`,
      name,
      safe(p.email) || ""
    ].join("\n");
  }

  if(type === "rollout_plan"){
    return [
      `30-Day Rollout Plan — ${name} — ${project}`,
      ``,
      `Week 1: Tease + Pre-save`,
      `- Post teaser clip + cover reveal`,
      `- Pre-save link in bio`,
      `- 3 stories/day (behind the scenes)`,
      ``,
      `Week 2: Release + Push`,
      `- Release day post + short video`,
      `- Send to DJs / blogs / playlists`,
      `- Live session / listening party`,
      ``,
      `Week 3: Content Wave`,
      `- Performance clip + lyric snippet`,
      `- Collab post with producer / feature`,
      `- 2 short-form videos`,
      ``,
      `Week 4: Radio/Playlist Follow-up`,
      `- Follow-up emails + DM outreach`,
      `- Fan recap + thank you post`,
      `- Tease next drop`,
      ``,
      `Notes:`,
      notes || "(add notes)"
    ].join("\n");
  }

  if(type === "social_captions"){
    return [
      `Social Captions Pack — ${name} — ${project}`,
      ``,
      `1) ${project} out now. Run it up. 🔥`,
      `2) New ${genre} vibes from ${name}. Tap in.`,
      `3) If you feel this, share it to your story 💛`,
      `4) ${project} — link in bio.`,
      `5) Studio mode → drop mode. ${project} is live.`,
      ``,
      `Hashtags:`,
      `#TKFMRecords #IndependentArtist #${genre.replace(/\s+/g,"") || "Music"} #NewMusic`,
      ``,
      `Notes:`,
      notes || "(add notes)"
    ].join("\n");
  }

  // default epk_pack
  return [
    `EPK Pack — ${name}`,
    ``,
    `ONE-LINER:`,
    `${name} is an independent ${genre} artist${city ? " from " + city : ""} delivering ${project}.`,
    ``,
    `BIO (short):`,
    `${name} blends ${genre} energy with a polished independent sound. ${project} is the latest release.`,
    ``,
    `PROJECT:`,
    `${project}`,
    ``,
    `LINKS:`,
    `${ig ? "IG: " + ig : ""}`,
    `${link ? "Link: " + link : ""}`,
    ``,
    `NOTES:`,
    notes || "(add notes)"
  ].join("\n");
}

export async function handler(event){
  if(event.httpMethod === "OPTIONS") return { statusCode:200, headers, body:"" };
  if(event.httpMethod !== "POST") return { statusCode:405, headers, body: JSON.stringify({ ok:false, error:"METHOD_NOT_ALLOWED" }) };

  if(!isOwner(event)){
    const deny = ownerDeny();
    deny.headers = Object.assign({}, headers, deny.headers);
    return deny;
  }

  try{
    const body = JSON.parse(event.body || "{}");
    const id = String(body.id || "").trim();
    const type = String(body.type || "epk_pack").trim();

    if(!id) return { statusCode:400, headers, body: JSON.stringify({ ok:false, error:"MISSING_ID" }) };

    const p = requestsPath();
    const store = readJson(p, { items: [] });
    const idx = (store.items || []).findIndex(x => x && x.id === id);
    if(idx < 0) return { statusCode:404, headers, body: JSON.stringify({ ok:false, error:"NOT_FOUND" }) };

    const item = store.items[idx];
    item.assets = (item.assets && typeof item.assets === "object") ? item.assets : {};

    const token = makeToken();
    const text = buildText(type, item);
    item.assets[type] = { at: nowIso(), token, text };

    store.items[idx] = item;
    writeJson(p, store);

    return { statusCode:200, headers, body: JSON.stringify({ ok:true, id, type, token, text }) };
  }catch(e){
    return { statusCode:500, headers, body: JSON.stringify({ ok:false, error: e.message }) };
  }
}
