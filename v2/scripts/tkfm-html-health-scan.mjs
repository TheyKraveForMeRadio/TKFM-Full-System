// Pass 3: HTML Health Scan -> .tkfm/pass3-health.txt
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OUTDIR = path.join(ROOT, ".tkfm");
const OUTFILE = path.join(OUTDIR, "pass3-health.txt");
fs.mkdirSync(OUTDIR, { recursive: true });

const isHtml = (f) => f.toLowerCase().endsWith(".html");
const files = fs.readdirSync(ROOT).filter(isHtml);

const results = {
  total: files.length,
  missing_body: [],
  missing_html: [],
  public_paths: [],
  empty_href: [],
  hash_href: [],
  suspicious_anchor_lines: [],
};

for (const f of files) {
  let s = "";
  try { s = fs.readFileSync(f, "utf8"); } catch { continue; }

  if (!s.includes("</body>")) results.missing_body.push(f);
  if (!s.includes("</html>")) results.missing_html.push(f);

  if (s.includes("/public/")) results.public_paths.push(f);

  // empty href or href="#"
  if (s.match(/href\s*=\s*["']\s*["']/i)) results.empty_href.push(f);
  if (s.match(/href\s*=\s*["']#["']/i)) results.hash_href.push(f);

  // common Vite parse killer: <a ... (line ends without >)
  const lines = s.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("<a ") && !line.includes(">") && line.trim().endsWith('"')) {
      results.suspicious_anchor_lines.push(`${f}:${i+1}`);
      break;
    }
  }
}

function fmtList(name, arr, max=200) {
  let out = `${name}: ${arr.length}\n`;
  arr.slice(0, max).forEach(x => out += ` - ${x}\n`);
  if (arr.length > max) out += ` ... ${arr.length - max} more\n`;
  out += "\n";
  return out;
}

let report = "";
report += "TKFM PASS 3 — HTML HEALTH SCAN\n";
report += `Time: ${new Date().toISOString()}\n`;
report += `Files scanned: ${results.total}\n\n`;

report += fmtList("MISSING </body>", results.missing_body);
report += fmtList("MISSING </html>", results.missing_html);
report += fmtList("FOUND /public/ PATHS", results.public_paths);
report += fmtList("EMPTY href=\"\"", results.empty_href);
report += fmtList("href=\"#\"", results.hash_href);
report += fmtList("SUSPICIOUS <a ... LINE (no >)", results.suspicious_anchor_lines);

fs.writeFileSync(OUTFILE, report, "utf8");
console.log("DONE: wrote", OUTFILE);
