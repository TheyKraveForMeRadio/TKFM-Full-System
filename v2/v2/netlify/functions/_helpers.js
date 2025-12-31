import fs from 'fs/promises'
import path from 'path'
import jwt from 'jsonwebtoken'

const DATA_DIR = path.join(process.cwd(), 'netlify', 'data')

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

function safeKey(key) {
  return String(key || 'store').replace(/[^a-z0-9_\-]/gi, '_').toLowerCase()
}

function filePathFor(key) {
  return path.join(DATA_DIR, `${safeKey(key)}.json`)
}

// JSON store helpers
export async function getStore(key) {
  await ensureDir()
  const fp = filePathFor(key)
  try {
    const raw = await fs.readFile(fp, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export async function setStore(key, value) {
  await ensureDir()
  const fp = filePathFor(key)
  await fs.writeFile(fp, JSON.stringify(value ?? [], null, 2), 'utf-8')
  return true
}

// JWT helpers (admin/staff/user)
export function signToken(payload, secret, options = {}) {
  if (!secret) throw new Error('Missing JWT secret')
  return jwt.sign(payload, secret, { expiresIn: '7d', ...options })
}

export function verifyToken(token, secret) {
  if (!secret) throw new Error('Missing JWT secret')
  return jwt.verify(token, secret)
}

export function getBearerToken(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || ''
  const m = auth.match(/^Bearer\s+(.+)$/i)
  return m ? m[1] : null
}
