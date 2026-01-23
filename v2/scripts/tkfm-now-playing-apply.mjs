// Patch now-playing.html + radio-hub.html to render Now Playing metadata
import fs from "fs";

function patchNowPlayingPage() {
  const file = "now-playing.html";
  if (!fs.existsSync(file)) return { file, changed: false, reason: "missing" };
  let html = fs.readFileSync(file, "utf8");
  let changed = false;

  // Add card container if not present
  if (!html.includes('id="tkfmNowPlayingCard"')) {
    const insert = `\n<section style="margin-top:14px" class="glass card">\n  <div id="tkfmNowPlayingCard"></div>\n</section>\n`;
    if (html.includes("</main>")) {
      html = html.replace("</main>", insert + "\n</main>");
      changed = true;
    } else if (html.includes("</body>")) {
      html = html.replace("</body>", insert + "\n</body>");
      changed = true;
    }
  }

  // Ensure widget script
  if (!html.includes("/js/tkfm-now-playing-widget.js") && html.includes("</body>")) {
    html = html.replace("</body>", `  <script type="module" src="/js/tkfm-now-playing-widget.js"></script>\n</body>`);
    changed = true;
  }

  if (changed) fs.writeFileSync(file, html, "utf8");
  return { file, changed };
}

function patchRadioHub() {
  const file = "radio-hub.html";
  if (!fs.existsSync(file)) return { file, changed: false, reason: "missing" };
  let html = fs.readFileSync(file, "utf8");
  let changed = false;

  if (!html.includes('id="tkfmNowPlayingLine"')) {
    // Put next to streamLabel if possible
    html = html.replace(
      /(<span[^>]*id="streamLabel"[^>]*>[^<]*<\/span>)/i,
      `$1\n            <span class="small" id="tkfmNowPlayingLine">Now Playing: —</span>`
    );
    changed = true;
  }

  if (!html.includes("/js/tkfm-now-playing-widget.js") && html.includes("</body>")) {
    html = html.replace("</body>", `  <script type="module" src="/js/tkfm-now-playing-widget.js"></script>\n</body>`);
    changed = true;
  }

  if (changed) fs.writeFileSync(file, html, "utf8");
  return { file, changed };
}

const a = patchNowPlayingPage();
const b = patchRadioHub();

console.log("DONE: now-playing apply");
console.log(" -", a.file, a.changed ? "patched" : "no change");
console.log(" -", b.file, b.changed ? "patched" : "no change");
