import fs from "fs";

const ROOT = process.cwd();
const isHtml = (f) => f.toLowerCase().endsWith(".html");
const files = fs.readdirSync(ROOT).filter(isHtml).filter(f => !f.startsWith("owner-"));

const href = "/start-here.html";
const label = "Start Here";

let changed = 0;

for (const f of files) {
  let html = fs.readFileSync(f, "utf8");
  if (html.includes(href)) continue;

  // only patch if a <nav ...> exists
  const navIdx = html.indexOf("<nav");
  const navClose = html.indexOf("</nav>");
  if (navIdx === -1 || navClose === -1 || navClose < navIdx) continue;

  const insertPos = navClose; // append before </nav>
  const link = `        <a class="pill" href="${href}">${label}</a>\n`;
  html = html.slice(0, insertPos) + link + html.slice(insertPos);

  fs.writeFileSync(f, html, "utf8");
  changed++;
}

console.log("DONE: injected Start Here into nav on", changed, "pages.");
