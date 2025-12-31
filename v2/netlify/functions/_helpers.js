import fs from 'fs/promises'
import path from 'path'
import jwt from 'jsonwebtoken'

const DATA_DIR = path.join(process.cwd(), 'netlify', 'data')

async function ensureDir() { await fs.mkdir(DATA_DIR, { recursive: true }) }
function safeKey(key) { return String(key || 'store').replace(/[^a-z0-9_-]/gi, '_').toLowerCase() }
function filePathFor(key) { return path.join(DATA_DIR, ${safeKey(key)}.json) }

export async function getStore(key) {
await ensureDir()
try { return JSON.parse(await fs.readFile(filePathFor(key), 'utf-8')) } catch { return [] }
}
export async function setStore(key, value) {
await ensureDir()
await fs.writeFile(filePathFor(key), JSON.stringify(value ?? [], null, 2), 'utf-8')
return true
}

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
