// TKFM: Owner Boost Orders Admin UI helper
(async function () {
  const out = document.getElementById('tkfmBoostOrdersOut');
  const totals = document.getElementById('tkfmBoostOrdersTotals');
  const table = document.getElementById('tkfmBoostOrdersTable');

  function set(el, txt){ if (el) el.textContent = txt; }
  function esc(s){ return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  async function getOwnerKey(){
    // Owner key is stored in .tkfm_owner_key by your scripts, but browser can't read file.
    // Your owner gate script typically exposes it via localStorage or prompt flow.
    // We'll try localStorage keys that TKFM already uses.
    const candidates = [
      'TKFM_OWNER_KEY',
      'tkfm_owner_key',
      'tkfmOwnerKey',
      'tkfm_owner'
    ];
    for (const k of candidates){
      const v = localStorage.getItem(k);
      if (v && v.length > 10) return v;
    }
    return '';
  }

  async function fetchStats(){
    const key = await getOwnerKey();
    const r = await fetch('/.netlify/functions/boost-orders-admin', {
      headers: key ? { 'x-tkfm-owner-key': key } : {}
    });
    const txt = await r.text();
    let j = null;
    try { j = JSON.parse(txt); } catch(e) {}
    return { ok:r.ok, status:r.status, json:j, raw:txt };
  }

  function fmtMoney(cents){
    const n = Number(cents || 0);
    const usd = (isFinite(n) ? n : 0) / 100;
    return '$' + usd.toFixed(2);
  }

  function render(j){
    if (!j || !j.ok){
      set(out, j ? JSON.stringify(j, null, 2) : 'No response');
      return;
    }

    const by = j.by_lookup || {};
    const lines = [];
    for (const k of Object.keys(by)){
      lines.push(`${k}: ${by[k].count} orders • ${fmtMoney(by[k].revenue)}`);
    }

    if (totals){
      totals.innerHTML = `
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <span style="padding:8px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.18);background:rgba(2,6,23,.55);">
            Total Orders: <b>${esc(j.total_count)}</b>
          </span>
          <span style="padding:8px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.18);background:rgba(2,6,23,.55);">
            Total Revenue: <b>${esc(fmtMoney(j.total_amount))}</b>
          </span>
          <span style="padding:8px 10px;border-radius:999px;border:1px solid rgba(148,163,184,.18);background:rgba(2,6,23,.55);">
            Last 30d Orders: <b>${esc(j.last30_count)}</b>
          </span>
        </div>
        <div style="margin-top:10px;color:rgba(255,255,255,.75);font-size:12px;line-height:1.4;">
          ${esc(lines.join(' | '))}
        </div>
      `;
    }

    if (table){
      const rows = (j.recent || []).slice(0, 50).map(o => {
        const dt = new Date(o.created_at || Date.now());
        const when = dt.toLocaleString();
        return `
          <tr>
            <td style="padding:10px;border-bottom:1px solid rgba(148,163,184,.14);">${esc(when)}</td>
            <td style="padding:10px;border-bottom:1px solid rgba(148,163,184,.14);"><b>${esc(o.lookup || '')}</b></td>
            <td style="padding:10px;border-bottom:1px solid rgba(148,163,184,.14);">${esc(fmtMoney(o.amount_total))}</td>
            <td style="padding:10px;border-bottom:1px solid rgba(148,163,184,.14);">${esc((o.customer_email || '').slice(0, 42))}</td>
            <td style="padding:10px;border-bottom:1px solid rgba(148,163,184,.14);"><code>${esc((o.session_id || '').slice(0, 18))}…</code></td>
          </tr>
        `;
      }).join('');

      table.innerHTML = `
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead>
            <tr style="text-align:left;color:rgba(255,255,255,.75);">
              <th style="padding:10px;border-bottom:1px solid rgba(148,163,184,.18);">When</th>
              <th style="padding:10px;border-bottom:1px solid rgba(148,163,184,.18);">Plan</th>
              <th style="padding:10px;border-bottom:1px solid rgba(148,163,184,.18);">Amount</th>
              <th style="padding:10px;border-bottom:1px solid rgba(148,163,184,.18);">Email</th>
              <th style="padding:10px;border-bottom:1px solid rgba(148,163,184,.18);">Session</th>
            </tr>
          </thead>
          <tbody>${rows || ''}</tbody>
        </table>
      `;
    }

    set(out, 'OK');
  }

  async function main(){
    if (out) set(out, 'Loading…');
    const res = await fetchStats();
    if (!res.json){
      if (out) set(out, `FAIL: status=${res.status}\n` + (res.raw || ''));
      return;
    }
    render(res.json);
  }

  const btn = document.getElementById('tkfmBoostOrdersRefresh');
  if (btn) btn.addEventListener('click', main);

  main();
})();
