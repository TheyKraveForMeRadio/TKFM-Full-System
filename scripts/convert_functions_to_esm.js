import fs from "fs/promises";
import path from "path";

const dir = path.join(process.cwd(), "netlify", "functions");

function toImportLine(match, varName, reqPath) {
  // if varName contains { ... } it's a destructure import
  if (varName.trim().startsWith("{")) {
    return `import ${varName.trim()} from '${reqPath}';`;
  }
  return `import ${varName.trim()} from '${reqPath}';`;
}

function convertContent(src) {
  let out = src;

  // 1) convert common patterns: const X = require('y');
  out = out.replace(/const\s+([A-Za-z0-9_\{\}\s,]+)\s*=\s*require\(['"](.+?)['"]\);?/g, (m, varName, reqPath) => {
    // fix destructured { a, b } = require('x') -> import { a, b } from 'x';
    if (varName.includes("{")) {
      return `import ${varName.trim()} from '${reqPath}';`;
    }
    return `import ${varName.trim()} from '${reqPath}';`;
  });

  // 2) convert var/let require too
  out = out.replace(/(?:var|let)\s+([A-Za-z0-9_\{\}\s,]+)\s*=\s*require\(['"](.+?)['"]\);?/g, (m, varName, reqPath) => {
    if (varName.includes("{")) {
      return `import ${varName.trim()} from '${reqPath}';`;
    }
    return `import ${varName.trim()} from '${reqPath}';`;
  });

  // 3) convert module.exports = { handler: ... } => export const handler = ...
  out = out.replace(/module\.exports\s*=\s*({[\s\S]*?});?/g, (m, obj) => {
    // naive: if object has handler: function(...) { ... } or handler: async (...) => { ... }
    const handlerMatch = obj.match(/handler\s*:\s*(async\s+function|\(\s*.*\s*\)\s*=>|function|\s*async\s*\(\s*.*\s*\)\s*=>)/);
    if (handlerMatch) {
      // replace "handler: " occurrences to "export const handler ="
      let replaced = obj.replace(/handler\s*:\s*/g, "export const handler = ");
      // remove wrapping braces
      replaced = replaced.replace(/^{\s*/, "").replace(/\s*}$/, "");
      return replaced;
    }
    // fallback - export default the object
    return `export default ${obj};`;
  });

  // 4) convert exports.handler = ... => export const handler = ...
  out = out.replace(/exports\.handler\s*=\s*/g, "export const handler = ");

  // 5) convert module.exports.handler = ... => export const handler = ...
  out = out.replace(/module\.exports\.handler\s*=\s*/g, "export const handler = ");

  // 6) remove commonjs trailing "module.exports = handler;" -> export default handler;
  out = out.replace(/module\.exports\s*=\s*([A-Za-z0-9_]+)\s*;?/g, "export default $1;");

  // 7) remove leftover "use strict"; lines (optional)
  out = out.replace(/['"]use strict['"];?\n?/g, "");

  return out;
}

async function convertFile(filePath) {
  const text = await fs.readFile(filePath, "utf8");
  const converted = convertContent(text);
  await fs.writeFile(filePath, converted, "utf8");
  console.log("Converted:", path.relative(process.cwd(), filePath));
}

async function run() {
  try {
    const files = await fs.readdir(dir);
    for (const f of files.filter(n => n.endsWith(".js"))) {
      await convertFile(path.join(dir, f));
    }
    console.log("✅ Conversion finished. Inspect changes and run tests.");
  } catch (err) {
    console.error("Error converting functions:", err);
    process.exit(1);
  }
}

run();
