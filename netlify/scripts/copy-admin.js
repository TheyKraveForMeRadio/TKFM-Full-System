// scripts/copy-admin.js — ENTERPRISE LOCKED
const fs = require('fs')
const path = require('path')

const ROOT = process.cwd()
const SRC = path.join(ROOT, 'admin')
const DEST = path.join(ROOT, 'dist', 'admin')

function fail(msg) {
  console.error(`✖ ${msg}`)
  process.exit(1)
}

try {
  // Ensure source exists
  if (!fs.existsSync(SRC)) {
    fail(`Source folder not found: ${SRC}`)
  }

  // Ensure dist exists
  const distDir = path.join(ROOT, 'dist')
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true })
  }

  // Clean destination first (prevents stale files)
  if (fs.existsSync(DEST)) {
    fs.rmSync(DEST, { recursive: true, force: true })
  }

  // Copy admin → dist/admin
  fs.cpSync(SRC, DEST, {
    recursive: true,
    dereference: true,
    errorOnExist: false,
  })

  console.log('✔ Admin panel copied into dist/admin/')
} catch (err) {
  fail(err.message || 'Admin copy failed')
}
