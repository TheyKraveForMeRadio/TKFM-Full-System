/* TKFM: wire a "Rotation Boost" link into radio-hub.html (safe best-effort).
   Usage: node scripts/tkfm-wire-rotation-boost-link.cjs radio-hub.html
*/
const fs = require('fs');

const file = process.argv[2] || 'radio-hub.html';
if (!fs.existsSync(file)) {
  console.log('SKIP: ' + file + ' not found');
  process.exit(0);
}

let s = fs.readFileSync(file, 'utf8');
if (s.includes('rotation-boost.html')) {
  console.log('OK: link already present in ' + file);
  process.exit(0);
}

const link = `\n<a href="/rotation-boost.html" style="text-decoration:none">\n  <button class="btn" type="button">Rotation Boost</button>\n</a>\n`;

// Try to insert into a common top-right controls div
const reControls = /(<div[^>]*style="[^"]*justify-content:flex-end[^"]*"[^>]*>)/m;
if (reControls.test(s)) {
  s = s.replace(reControls, `$1${link}`);
} else {
  // Insert right after <body> tag
  const reBody = /(<body[^>]*>\s*)/m;
  if (reBody.test(s)) s = s.replace(reBody, `$1${link}`);
  else s += link;
}

fs.writeFileSync(file, s, 'utf8');
console.log('OK: wired Rotation Boost link into ' + file);
