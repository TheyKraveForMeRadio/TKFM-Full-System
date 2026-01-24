import { loadStore, saveStore, uid, nowISO } from "./_tkfm_statements_store.mjs";
import { loadItems as loadReleases } from "./_tkfm_distribution_store.mjs";
import { loadPayouts, savePayouts, uid as payId, nowISO as payNow } from "./_tkfm_payouts_store.mjs";
import { parseCSV, normalizeHeader, toNumber } from "./_tkfm_csv.mjs";
import { ok, bad, json, isOptions } from "./_tkfm_cors.mjs";

function ownerOk(event){
  const want = process.env.TKFM_OWNER_KEY || process.env.OWNER_KEY || "";
  if(!want) return true;
  const got = (event.headers && (event.headers["x-tkfm-owner-key"] || event.headers["X-TKFM-OWNER-KEY"])) || "";
  return String(got) === String(want);
}

function lower(s){ return String(s||"").trim().toLowerCase(); }
function clamp(n, lo, hi){
  const x = Number(n);
  if(!Number.isFinite(x)) return null;
  return Math.max(lo, Math.min(hi, x));
}

function findRelease(releases, release_id, title){
  if(release_id){
    const r = releases.find(x => String(x.id||"") === String(release_id));
    if(r) return r;
  }
  if(title){
    const t = lower(title);
    const r = releases.find(x => lower(x.project_title||"") === t);
    if(r) return r;
  }
  return null;
}

function normalizeSplits(artistSplit, tkfmSplit){
  let a = clamp(artistSplit, 0, 100);
  let t = clamp(tkfmSplit, 0, 100);

  if(a === null) a = 60;
  if(t === null) t = 100 - a;

  // hard normalize: TKFM becomes remainder
  t = Math.max(0, 100 - a);

  return { artist_split: a, tkfm_split: t };
}

export async function handler(event){
  if(isOptions(event)) return json(200, { ok:true });
  const method=(event.httpMethod||"GET").toUpperCase();
  if(method!=="POST") return bad(405, "POST required");
  if(!ownerOk(event)) return bad(403, "owner_key_required");

  let body={};
  try{ body=JSON.parse(event.body||"{}"); }catch(e){ return bad(400,"Invalid JSON"); }

  const csv=String(body.csv||"");
  const period=String(body.period||"").trim();
  const dsp=String(body.dsp||"DSP").trim()||"DSP";
  if(!csv.trim()) return bad(400,"csv required");

  const rows=parseCSV(csv);
  if(rows.length<2) return bad(400,"csv must include header + rows");

  const header=rows[0].map(normalizeHeader);
  const idx=(names)=>{ for(const n of names){ const i=header.indexOf(n); if(i>=0) return i; } return -1; };

  const iRelease=idx(["release_id","id","tkfm_release_id","tkfm_id"]);
  const iTitle=idx(["project_title","title","release_title","album","track_title"]);
  const iEmail=idx(["email","artist_email","payout_email"]);
  const iNet=idx(["net_amount","net","amount","earnings","revenue","royalty"]);
  const iCurrency=idx(["currency","ccy"]);
  const iTerr=idx(["territory","country"]);
  const iQty=idx(["streams","quantity","qty","units"]);

  const releases=loadReleases();
  const store=loadStore();
  const payouts=loadPayouts();

  const defaultArtistSplit=Number(body.artist_split ?? 60);
  const defaultTkfmSplit=Number(body.tkfm_split ?? 40);
  const defaultAdminFee=Number(body.admin_fee ?? 0);

  const lines=[];
  let matched=0;

  for(const r of rows.slice(1)){
    const release_id = iRelease>=0 ? String(r[iRelease]||"").trim() : "";
    const title = iTitle>=0 ? String(r[iTitle]||"").trim() : "";
    const email = iEmail>=0 ? String(r[iEmail]||"").trim().toLowerCase() : "";
    const net = iNet>=0 ? toNumber(r[iNet]) : 0;
    const currency = iCurrency>=0 ? String(r[iCurrency]||"").trim().toLowerCase() : "usd";
    const territory = iTerr>=0 ? String(r[iTerr]||"").trim() : "";
    const qty = iQty>=0 ? toNumber(r[iQty]) : 0;
    if(!net && !qty) continue;

    const rel = findRelease(releases, release_id, title);
    const relId = rel ? rel.id : (release_id || "");
    const relTitle = rel ? (rel.project_title||title) : title;
    const relEmail = rel ? lower(rel.email||"") : email;

    const rawArtist = rel && typeof rel.artist_split==="number" ? rel.artist_split : defaultArtistSplit;
    const rawTkfm = rel && typeof rel.tkfm_split==="number" ? rel.tkfm_split : defaultTkfmSplit;
    const { artist_split, tkfm_split } = normalizeSplits(rawArtist, rawTkfm);

    const adminFee = rel && typeof rel.admin_fee==="number" ? rel.admin_fee : defaultAdminFee;

    let artistAmt = net * (artist_split/100);
    let tkfmAmt = net * (tkfm_split/100);

    let adminApplied = 0;
    if(adminFee && adminFee > 0){
      adminApplied = Math.min(adminFee, artistAmt);
      artistAmt = Math.max(0, artistAmt - adminApplied);
      tkfmAmt = tkfmAmt + adminApplied;
    }

    if(rel) matched++;

    lines.push({
      release_id: relId,
      project_title: relTitle,
      email: relEmail,
      dsp, period, currency, territory,
      quantity: qty,
      net_amount: net,
      artist_split,
      tkfm_split,
      admin_fee: adminFee || 0,
      admin_fee_applied: Number(adminApplied.toFixed(2)),
      artist_amount: Number(artistAmt.toFixed(2)),
      tkfm_amount: Number(tkfmAmt.toFixed(2)),
      imported_at: nowISO()
    });
  }

  const batchId = uid("batch");
  store.batches = store.batches || [];
  store.batches.unshift({ id: batchId, created_at: nowISO(), dsp, period, rows: lines, stats: { total_lines: lines.length, matched_releases: matched } });
  store.batches = store.batches.slice(0, 40);
  const saved = saveStore(store);

  payouts.items = payouts.items || [];
  const agg = new Map();
  for(const l of lines){
    if(!l.email) continue;
    const k=[l.release_id||"", l.email||"", l.period||"", l.dsp||"", l.currency||"usd"].join("|");
    const cur = agg.get(k) || { ...l, artist_amount:0, tkfm_amount:0, net_amount:0, quantity:0, admin_fee_applied:0 };
    cur.artist_amount += l.artist_amount;
    cur.tkfm_amount += l.tkfm_amount;
    cur.net_amount += l.net_amount;
    cur.quantity += l.quantity;
    cur.admin_fee_applied += Number(l.admin_fee_applied||0);
    agg.set(k, cur);
  }

  let created=0;
  for(const v of agg.values()){
    const existing = payouts.items.find(x => x.release_id===v.release_id && x.email===v.email && x.period===v.period && x.dsp===v.dsp && x.currency===v.currency && x.status!=="paid");
    if(existing){
      existing.amount = Number((Number(existing.amount||0) + v.artist_amount).toFixed(2));
      existing.tkfm_amount = Number((Number(existing.tkfm_amount||0) + v.tkfm_amount).toFixed(2));
      existing.admin_fee_applied = Number((Number(existing.admin_fee_applied||0) + Number(v.admin_fee_applied||0)).toFixed(2));
      existing.updated_at = payNow();
      continue;
    }
    payouts.items.unshift({
      id: payId("pay"),
      created_at: payNow(),
      updated_at: payNow(),
      status: "unpaid",
      release_id: v.release_id,
      project_title: v.project_title,
      email: v.email,
      dsp: v.dsp,
      period: v.period,
      currency: v.currency,
      amount: Number(v.artist_amount.toFixed(2)),
      tkfm_amount: Number(v.tkfm_amount.toFixed(2)),
      admin_fee_applied: Number(Number(v.admin_fee_applied||0).toFixed(2)),
      note: v.admin_fee_applied ? ("Imported (admin fee applied $" + Number(v.admin_fee_applied||0).toFixed(2) + ")") : "Imported"
    });
    created++;
  }
  payouts.items = payouts.items.slice(0, 5000);
  const savedPay = savePayouts(payouts);

  return ok({ batch_id: batchId, backend: saved.backend, payout_backend: savedPay.backend, stats: { lines: lines.length, matched_releases: matched, payout_items_created: created } });
}
