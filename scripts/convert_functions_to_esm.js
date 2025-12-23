import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const DIR = path.join(ROOT, 'netlify', 'functions')

// Set to false to actually write changes
const DRY_RUN = true

const BACKUP_DIR = path.join(ROOT, '.esm-backups')

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function backupFile(filePath, rel) {
  ensureDir(BACKUP_DIR)
  const out = path.join(BACKUP_DIR, rel)
  ensureDir(path.dirname(out))
  fs.copyFileSync(filePath, out)
}

function looksESM(code) {
  return /\bimport\s.+from\s+['"]/.test(code) || /\bexport\s+(const|default|function)\b/.test(code)
}

function convert(code) {
  let out = code

  // Convert exports.handler -> export const handler
  out = out.replace(/\bexports\.handler\s*=\s*/g, 'export const handler = ')
  out = out.replace(/\bmodule\.exports\.handler\s*=\s*/g, 'export const handler = ')
  out = out.replace(/\bmodule\.exports\s*=\s*/g, 'export default ')

  // Convert require destructuring: const {a,b} = require('x')
  out = out.replace(
    /const\s+\{\s*([^}]+)\s*\}\s*=\s*require\((['"][^'"]+['"])\)\s*;?/g,
    'import { $1 } from $2'
  )

  // Convert default require: const X = require('x')
  out = out.replace(
    /const\s+([A-Za-z_$][\w$]*)\s*=\s*require\((['"][^'"]+['"])\)\s*;?/g,
    'import $1 from $2'
  )

  return out
}

function walk(dirPath) {
  for (const file of fs.readdirSync(dirPath)) {
    const full = path.join(dirPath, file)
    const stat = fs.statSync(full)

    if (stat.isDirectory()) {
      walk(full)
      continue
    }

    if (!file.endsWith('.js')) continue

    // Skip helpers and any file that already looks like ESM
    if (file === '_helpers.js') continue

    const rel = path.relative(ROOT, full)
    const code = fs.readFileSync(full, 'utf8')

    if (looksESM(code)) {
      console.log(`↷ Skip (already ESM): ${rel}`)
      continue
    }

    const converted = convert(code)

    if (converted === code) {
      console.log(`↷ Skip (no changes): ${rel}`)
      continue
    }

    console.log(`✔ Convert: ${rel}`)

    if (!DRY_RUN) {
      backupFile(full, rel)
      fs.writeFileSync(full, converted, 'utf8')
    }
  }
}

console.log(`\nTKFM ESM Converter — DRY_RUN=${DRY_RUN}\n`)
walk(DIR)
console.log(`\nDone.\n${DRY_RUN ? 'No files were written (dry run).' : `Backups saved in: ${BACKUP_DIR}`}\n`)
