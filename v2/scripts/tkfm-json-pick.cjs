// TKFM: JSON pick helper (no pipes / no broken-pipe)
const fs = require('fs');

const jsonRaw = process.argv[2] || '';
const expr = process.argv[3] || '';

let j;
try { j = JSON.parse(jsonRaw); } catch (e) { process.stdout.write(''); process.exit(0); }

try {
  // eslint-disable-next-line no-eval
  const out = eval(expr);
  if (out == null) process.stdout.write('');
  else process.stdout.write(String(out));
} catch (e) {
  process.stdout.write('');
}
