import fs from "fs";

const file = "tkfm-sitemap.html";
if (!fs.existsSync(file)) {
  console.error("ERROR: tkfm-sitemap.html not found in project root.");
  process.exit(1);
}

let html = fs.readFileSync(file, "utf8");

const adds = [
  { href: "/ai-dj-drops.html", label: "AI DJ Drops" },
  { href: "/podcast.html", label: "Podcast" }
];

const missing = adds.filter(x => !html.includes(`href="${x.href}"`) && !html.includes(`href='${x.href}'`));

if (!missing.length) {
  console.log("OK: sitemap already contains ai-dj-drops + podcast links.");
  process.exit(0);
}

// Insert into the first <ul> (before first </ul>) to keep it clean
const ulClose = html.indexOf("</ul>");
if (ulClose === -1) {
  console.error("ERROR: Could not find </ul> in tkfm-sitemap.html to insert links.");
  process.exit(1);
}

const insert = missing.map(x => `    <li><a href="${x.href}">${x.label}</a></li>`).join("\n") + "\n";
html = html.slice(0, ulClose) + insert + html.slice(ulClose);

fs.writeFileSync(file, html);
console.log("DONE: Added missing public links to tkfm-sitemap.html:", missing.map(m => m.href).join(", "));
