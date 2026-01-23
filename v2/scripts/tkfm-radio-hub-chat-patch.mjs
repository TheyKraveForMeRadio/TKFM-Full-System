// Patch radio-hub.html to use /js/tkfm-station-chat.js instead of /src/station-chat.js
import fs from "fs";

const file = "radio-hub.html";
if (!fs.existsSync(file)) {
  console.error("ERROR: radio-hub.html not found in project root.");
  process.exit(1);
}

let html = fs.readFileSync(file, "utf8");

const from = /<script\s+type="module"\s+src="\/src\/station-chat\.js"\s*><\/script>/i;
const to = `<script type="module" src="/js/tkfm-station-chat.js"></script>`;

if (from.test(html)) {
  html = html.replace(from, to);
  fs.writeFileSync(file, html, "utf8");
  console.log("DONE: patched radio-hub.html -> /js/tkfm-station-chat.js");
} else if (!html.includes("/js/tkfm-station-chat.js")) {
  // Fallback: if script missing, append before </body>
  if (html.includes("</body>")) {
    html = html.replace("</body>", `  ${to}\n</body>`);
    fs.writeFileSync(file, html, "utf8");
    console.log("DONE: appended station chat script to radio-hub.html");
  } else {
    console.log("WARN: could not patch radio-hub.html (no </body> found).");
  }
} else {
  console.log("OK: radio-hub.html already patched.");
}
