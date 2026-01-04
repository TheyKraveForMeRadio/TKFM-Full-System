/* TKFM: Ensure pages include /js/tkfm-featured-id.js before /js/tkfm-featured-track.js
   Usage: node scripts/tkfm-wire-featured-id-helper.cjs .
*/
const fs = require('fs');
const path = require('path');
const ROOT = process.argv[2] || '.';

const targets = [
  path.join(ROOT, 'radio-hub.html'),
  path.join(ROOT, 'owner-boost-dashboard.html'),
  path.join(ROOT, 'owner-tracking-test.html')
];

function read(p){ return fs.readFileSync(p,'utf8'); }
function write(p,s){ fs.writeFileSync(p,s,'utf8'); }

function ensure(p) {
  if (!fs.existsSync(p)) { console.log('SKIP: ' + path.basename(p) + ' not found'); return; }
  let s = read(p);

  if (!s.includes('/js/tkfm-featured-id.js')) {
    // place before featured-track if present, else before </body>
    if (s.includes('/js/tkfm-featured-track.js')) {
      s = s.replace(/<script\s+src="\/js\/tkfm-featured-track\.js"><\/script>/i, `<script src="/js/tkfm-featured-id.js"></script>\n  <script src="/js/tkfm-featured-track.js"></script>`);
      if (!s.includes('/js/tkfm-featured-id.js')) {
        // if different spacing
        s = s.replace(/<script\s+src="\/js\/tkfm-featured-track\.js"\s*><\/script>/i, `<script src="/js/tkfm-featured-id.js"></script>\n  <script src="/js/tkfm-featured-track.js"></script>`);
      }
    } else if (s.match(/<\/body>/i)) {
      s = s.replace(/<\/body>/i, `  <script src="/js/tkfm-featured-id.js"></script>\n</body>`);
    } else {
      s += `\n<script src="/js/tkfm-featured-id.js"></script>\n`;
    }
  }

  write(p,s);
  console.log('OK: wired featured-id helper into ' + path.basename(p));
}

targets.forEach(ensure);
