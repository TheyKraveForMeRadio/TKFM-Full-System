/* TKFM: Wire auto-maintenance into owner-boost-dashboard.html
   Adds:
     - Auto-run maintenance + normalize once per 24h (owner-only) when dashboard loads
     - Uses existing endpoints:
         /.netlify/functions/featured-media-maintenance
         /.netlify/functions/featured-media-normalize-ids

   Idempotent: safe to re-run.

   Usage:
     node scripts/tkfm-wire-owner-auto-maintenance.cjs .
*/
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || '.';
const f = path.join(ROOT, 'owner-boost-dashboard.html');

if (!fs.existsSync(f)) {
  console.log('FAIL: owner-boost-dashboard.html not found');
  process.exit(2);
}

let s = fs.readFileSync(f, 'utf8');

if (s.includes('TKFM_AUTO_MAINTENANCE_V1')) {
  console.log('OK: auto-maintenance already wired');
  process.exit(0);
}

const snippet = `
  // TKFM_AUTO_MAINTENANCE_V1
  async function tkfmAutoMaintenance() {
    try {
      const k = ownerKey && ownerKey();
      if (!k) return;

      const last = Number(localStorage.getItem('tkfm_last_featured_maint_ms') || '0');
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      if (last && (now - last) < day) return;

      // Run cleanup (dedupe + unboost expired + cap store)
      await fetch('/.netlify/functions/featured-media-maintenance', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-tkfm-owner-key': k },
        body: JSON.stringify({ keepMax: 250 })
      }).catch(() => null);

      // Normalize ids (add id from url-hash when missing)
      await fetch('/.netlify/functions/featured-media-normalize-ids', {
        method: 'POST',
        headers: { 'x-tkfm-owner-key': k }
      }).catch(() => null);

      localStorage.setItem('tkfm_last_featured_maint_ms', String(now));

      if (typeof showMsg === 'function') showMsg('Auto maintenance complete (daily).', 'info');
      if (typeof refresh === 'function') refresh();
    } catch (_) {}
  }
`;

function insertBeforeClosingScript(s) {
  // Insert into the last </script> block in the file (assumes inline script exists)
  const idx = s.lastIndexOf('</script>');
  if (idx === -1) return null;
  return s.slice(0, idx) + snippet + '\n' + s.slice(idx);
}

let out = insertBeforeClosingScript(s);

if (!out) {
  // fallback: append before </body>
  out = s.replace(/<\/body>/i, `<script>${snippet}\n</script>\n</body>`);
}

if (!out.includes('TKFM_AUTO_MAINTENANCE_V1')) {
  console.log('FAIL: could not inject auto-maintenance');
  process.exit(3);
}

// Also try to trigger it once on load by injecting a call
if (!out.includes('tkfmAutoMaintenance();')) {
  // prefer after initial refresh call if present
  if (out.match(/refresh\(\)\s*;?/)) {
    out = out.replace(/refresh\(\)\s*;?/m, (m) => m + '\n    tkfmAutoMaintenance();');
  } else {
    out = out.replace(/DOMContentLoaded['"]\s*,\s*([^)]+)\)/, (m) => m + '\n    tkfmAutoMaintenance();');
  }
  if (!out.includes('tkfmAutoMaintenance();')) {
    // last resort: append near end of script
    const idx = out.lastIndexOf('</script>');
    out = out.slice(0, idx) + '\n  tkfmAutoMaintenance();\n' + out.slice(idx);
  }
}

fs.writeFileSync(f, out, 'utf8');
console.log('OK: wired auto-maintenance into owner-boost-dashboard.html');
