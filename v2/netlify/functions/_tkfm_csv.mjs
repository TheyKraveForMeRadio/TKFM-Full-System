export function parseCSV(text){
  const rows=[]; const s=String(text||"").replace(/^\uFEFF/,"");
  let row=[]; let cur=""; let inQ=false;
  for(let i=0;i<s.length;i++){
    const ch=s[i], nx=s[i+1];
    if(inQ){
      if(ch==='"' && nx==='"'){ cur+='"'; i++; continue; }
      if(ch==='"'){ inQ=false; continue; }
      cur+=ch; continue;
    }
    if(ch==='"'){ inQ=true; continue; }
    if(ch===','){ row.push(cur); cur=""; continue; }
    if(ch==='\n'){ row.push(cur); cur=""; if(row.length>1 || (row.length===1 && row[0].trim()!=="")) rows.push(row); row=[]; continue; }
    if(ch==='\r') continue;
    cur+=ch;
  }
  row.push(cur);
  if(row.length>1 || (row.length===1 && row[0].trim()!=="")) rows.push(row);
  return rows;
}
export function normalizeHeader(h){
  return String(h||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"_");
}
export function toNumber(x){
  const s=String(x||"").trim(); if(!s) return 0;
  const c=s.replace(/[^0-9.\-]/g,""); const n=Number(c);
  return Number.isFinite(n)?n:0;
}
