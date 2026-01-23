import fs from "fs";

const file = "autopilot-engine.html";
if (!fs.existsSync(file)) {
  console.error("ERROR: autopilot-engine.html not found.");
  process.exit(1);
}

let html = fs.readFileSync(file, "utf8");
let changed = 0;

function normalizeAttrs(attrs) {
  let a = (attrs || "").trimEnd();
  if (a.length && !a.endsWith(" ")) a += " ";
  return a;
}

// CASE A: <a ... (NO '>') then newline then <button
// example:
// <a class="..."
// <button ...>
{
  const re = /(\n[ \t]*)<a\b([^\n>]*)\n([ \t]*)<button\b/g;
  html = html.replace(re, (m, indentA, attrs, indentB) => {
    changed++;
    const a = normalizeAttrs(attrs);
    return `${indentA}<a${a}href="/owner-login.html">Owner Login</a>\n${indentB}<button`;
  });
}

// CASE B: <a ...> (but missing </a> and next line is <button
{
  const re = /(\n[ \t]*)<a\b([^>]*)>\s*\n([ \t]*)<button\b/g;
  html = html.replace(re, (m, indentA, attrs, indentB) => {
    // if already a proper Owner Login link, leave it alone
    if (m.includes("Owner Login</a>")) return m;
    changed++;
    const a = normalizeAttrs(attrs);
    return `${indentA}<a${a}href="/owner-login.html">Owner Login</a>\n${indentB}<button`;
  });
}

if (!changed) {
  console.log("OK: No autopilot parse issue pattern found (file may already be fixed or different).");
} else {
  fs.writeFileSync(file, html, "utf8");
  console.log(`DONE: Fixed autopilot-engine.html parse issue (${changed} change(s)).`);
}
