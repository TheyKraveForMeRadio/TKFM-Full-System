import fs from "fs";
import path from "path";

const dir = "./netlify/functions";

function convertFile(filePath) {
  let code = fs.readFileSync(filePath, "utf8");

  code = code
    .replace(/const (\w+) = require\((.*?)\)/g, "import $1 from $2")
    .replace(/module\.exports\s*=\s*/g, "export default ");

  fs.writeFileSync(filePath, code, "utf8");
  console.log("✔️ Converted:", filePath);
}

function walk(dirPath) {
  for (const file of fs.readdirSync(dirPath)) {
    const full = path.join(dirPath, file);

    if (fs.statSync(full).isDirectory()) walk(full);
    else if (file.endsWith(".js")) convertFile(full);
  }
}

walk(dir);
console.log("\n🎉 All functions converted to ESM!\n");
