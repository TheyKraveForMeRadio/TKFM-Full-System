/* Add "Run Cleanup" button to owner-boost-dashboard.html (safe idempotent)
   Usage: node scripts/tkfm-wire-owner-boost-dashboard-cleanup-link.cjs .
*/
const fs = require('fs');
const path = require('path');
const ROOT = process.argv[2] || '.';
const f = path.join(ROOT, 'owner-boost-dashboard.html');
if (!fs.existsSync(f)) { console.log('SKIP: owner-boost-dashboard.html not found'); process.exit(0); }
let s = fs.readFileSync(f, 'utf8');
if (s.includes('id="cleanupBtn"')) { console.log('OK: cleanup button already present'); process.exit(0); }

const btn = '\n        <button class="btn" id="cleanupBtn" type="button">Run Cleanup</button>\n';

if (s.includes('id="resetBtn"')) {
  s = s.replace(/(\s*<button class="btn btnDanger" id="resetBtn"[^>]*>Reset Stats<\/button>\s*)/i, `$1${btn}`);
} else {
  s = s.replace(/(<button[^>]*id="refreshBtn"[^>]*>Refresh<\/button>)/i, `$1${btn}`);
}

if (!s.includes('id="cleanupBtn"')) {
  // fallback append near end
  s = s.replace(/<\/body>/i, btn + '\n</body>');
}

if (!s.includes('function runCleanup')) {
  const hook = `
    async function runCleanup() {
      const k = ownerKey();
      if (!k) { showMsg('Missing owner key. Login owner first.', 'err'); return; }
      showMsg('Running cleanup…', 'info');
      const res = await fetch('/.netlify/functions/featured-media-maintenance', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-tkfm-owner-key': k },
        body: JSON.stringify({ keepMax: 250 })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) { showMsg(data.error || 'Cleanup failed', 'err'); return; }
      showMsg('Cleanup complete: ' + data.before + ' → ' + data.after, 'info');
      refresh();
    }
`;
  // insert hook before the existing refresh() definition call at bottom
  s = s.replace(/async function refresh\(\) \{/i, hook + '\n    async function refresh() {');
  // bind button if exists
  s = s.replace(/(\$\('#resetBtn'\)\.addEventListener\('click',[\s\S]*?\);\s*)/m, `$1\n    const cb = document.getElementById('cleanupBtn');\n    if (cb) cb.addEventListener('click', runCleanup);\n`);
}

fs.writeFileSync(f, s, 'utf8');
console.log('OK: wired cleanup button into owner-boost-dashboard.html');
