const fs = require("fs");
const path = require("path");

const src = path.join(process.cwd(), "admin");
const dest = path.join(process.cwd(), "dist", "admin");

fs.cpSync(src, dest, { recursive: true });
console.log("✔ Admin panel copied into dist/");

