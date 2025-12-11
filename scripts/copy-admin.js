const fs = require("fs");
const path = require("path");

const src = path.join(process.cwd(), "admin");
const dest = path.join(process.cwd(), "dist", "admin");

if (!fs.existsSync(src)) {
  console.error("❌ admin/ folder does not exist.");
  process.exit(1);
}

fs.mkdirSync(dest, { recursive: true });
fs.cpSync(src, dest, { recursive: true });

console.log("✔ Admin panel copied into dist/admin/");
