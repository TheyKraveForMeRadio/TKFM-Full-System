import fs from "fs";
import path from "path";

const src = path.join(process.cwd(), "admin");
const dest = path.join(process.cwd(), "dist", "admin");

if (!fs.existsSync(src)) {
  console.log("ℹ️ No /admin folder found — skipping admin copy");
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
fs.cpSync(src, dest, { recursive: true });

console.log("✔ Admin panel copied into dist/admin");
