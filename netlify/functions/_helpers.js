// netlify/functions/_helpers.js — ENTERPRISE LOCKED
// Storage: Netlify Blobs (@netlify/blobs)
// Auth: JWT helpers for admin/staff/dj
// Utilities: strict JSON, CORS, sanitizers

import jwt from 'jsonwebtoken'
import { getStore as getBlobStore } from '@netlify/blobs'

/* =========================
   CONSTANTS / DEFAULTS
========================= */

const STORE_PREFIX = 'tkfm_store_' // keeps all stores namespaced
const STORE_TTL_SECONDS = 0        // 0 = no ttl, persist

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-TKFM-Internal-Key, x-tkfm-internal-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

/* =========================
   RESPONSE HELPERS
========================= */

export function preflight(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' }
  }
  return null
}

export function json(statusCode, obj, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
    body: JSON.stringify(obj),
  }
}

export function text(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: { ...CORS_HEADERS, 'Content-Type': 'text/plain; charset=utf-8', ...extraHeaders },
    body: String(body ?? ''),
  }
}

/* =========================
   SAFE JSON PARSE (SIZE CAPPED)
========================= */

export function safeParse(body, maxBytes = 200_000) {
  if (!body || typeof body !== 'string') return null
  if (body.length > maxBytes) return null
  try { return JSON.parse(body) } catch { return null }
}

/* =========================
   SANITIZERS
========================= */

export function safeString(v, min = 1, max = 200) {
  if (typeof v !== 'string') return ''
  const s = v.trim()
  if (s.length < min) return ''
  return s.length > max ? s.slice(0, max) : s
}

export function safeInt(v, def = 0, min = -1e9, max = 1e9) {
  const n = Number(v)
  if (!Number.isFinite(n)) return def
  const i = Math.floor(n)
  return Math.min(max, Math.max(min, i))
}

export function safeBool(v, def = false) {
  if (typeof v === 'boolean') return v
  return def
}

export function safeUrl(v, { allowHttpLocalhost = true } = {}) {
  if (v == null) return null
  if (typeof v !== 'string') return null
  const s = v.trim()
  if (!s || s.length > 800) return null
  try {
    const u = new URL(s)
    const isLocalhost = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
    if (u.protocol === 'https:') return u.toString()
    if (allowHttpLocalhost && u.protocol === 'http:' && isLocalhost) return u.toString()
    return null
  } catch {
    return null
  }
}

export function getBearer(event) {
  const h = event.headers?.authorization || event.headers?.Authorization || ''
  return typeof h === 'string' && h.startsWith('Bearer ') ? h.slice(7).trim() : ''
}

export function getClientIp(event) {
  return (
    event.headers?.['x-nf-client-connection-ip'] ||
    event.headers?.['x-forwarded-for'] ||
    event.headers?.['client-ip'] ||
    'unknown'
  )
}

/* =========================
   NETLIFY BLOBS STORAGE
   getStore(name) / setStore(name, value)
========================= */

function storeKey(name) {
  const clean = safeString(name, 1, 60).toLowerCase().replace(/[^a-z0-9_-]/g, '_')
  return `${STORE_PREFIX}${clean}`
}

function blobs() {
  // A single blobs store bucket for TKFM
  return getBlobStore('tkfm')
}

/**
 * getStore('mixtapes') -> array/object (defaults to [])
 */
export async function getStore(name, fallback = []) {
  const key = storeKey(name)
  try {
    const v = await blobs().get(key, { type: 'json' })
    if (v == null) return fallback
    // Ensure store is sane
    if (Array.isArray(fallback) && !Array.isArray(v)) return fallback
    if (!Array.isArray(fallback) && typeof v !== 'object') return fallback
    return v
  } catch (err) {
    console.error('getStore error:', name, err?.message || err)
    return fallback
  }
}

/**
 * setStore('mixtapes', storeArray)
 */
export async function setStore(name, value) {
  const key = storeKey(name)
  // guardrail: prevent saving huge payloads
  const bytes = Buffer.byteLength(JSON.stringify(value ?? null), 'utf8')
  if (bytes > 900_000) {
    // Netlify blobs can store more, but keeping a guardrail helps prevent accidental bloat.
    throw new Error(`Store payload too large for "${name}" (${bytes} bytes)`)
  }

  await blobs().set(key, value, STORE_TTL_SECONDS ? { ttl: STORE_TTL_SECONDS } : undefined)
  return true
}

/* =========================
   AUTH — JWT ROLE HELPERS
   issuer/audience are enforced to prevent token confusion
========================= */

function requireEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Server not configured (${name})`)
  return v
}

function verifyJwt(token, secret, opts) {
  try {
    return jwt.verify(token, secret, opts)
  } catch {
    const err = new Error('Invalid or expired token')
    err.statusCode = 401
    throw err
  }
}

export function requireAdmin(event) {
  const secret = requireEnv('ADMIN_JWT_SECRET')
  const token = getBearer(event)
  if (!token) {
    const err = new Error('Unauthorized')
    err.statusCode = 401
    throw err
  }
  const decoded = verifyJwt(token, secret, { issuer: 'tkfm', audience: 'tkfm-admin' })
  if (!decoded || decoded.role !== 'admin') {
    const err = new Error('Forbidden')
    err.statusCode = 403
    throw err
  }
  return decoded
}

export function requireStaff(event) {
  const secret = requireEnv('STAFF_JWT_SECRET')
  const token = getBearer(event)
  if (!token) {
    const err = new Error('Unauthorized')
    err.statusCode = 401
    throw err
  }
  const decoded = verifyJwt(token, secret, { issuer: 'tkfm', audience: 'tkfm-staff' })
  if (!decoded || decoded.role !== 'staff') {
    const err = new Error('Forbidden')
    err.statusCode = 403
    throw err
  }
  return decoded
}

export function requireDJ(event) {
  const secret = requireEnv('DJ_JWT_SECRET')
  const token = getBearer(event)
  if (!token) {
    const err = new Error('Unauthorized')
    err.statusCode = 401
    throw err
  }
  const decoded = verifyJwt(token, secret, { issuer: 'tkfm', audience: 'tkfm-dj' })
  if (!decoded || decoded.role !== 'dj') {
    const err = new Error('Forbidden')
    err.statusCode = 403
    throw err
  }
  return decoded
}

/* =========================
   INTERNAL / CRON GUARD
========================= */

export function requireInternalKey(event) {
  const expected = requireEnv('INTERNAL_CRON_KEY')
  const key =
    event.headers?.['x-tkfm-internal-key'] ||
    event.headers?.['X-TKFM-Internal-Key'] ||
    event.headers?.['x-tkfm-internal-key'.toLowerCase()] ||
    ''

  if (!key || key !== expected) {
    const err = new Error('Forbidden')
    err.statusCode = 403
    throw err
  }
  return true
}

/* =========================
   SUPABASE CLIENT HELPERS (optional)
   Only use these in functions that talk to Supabase.
========================= */

export async function createSupabaseServiceClient() {
  const { createClient } = await import('@supabase/supabase-js')
  const url = requireEnv('SUPABASE_URL')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key)
}

export async function createSupabaseAnonClient() {
  const { createClient } = await import('@supabase/supabase-js')
  const url = requireEnv('SUPABASE_URL')
  const key = requireEnv('SUPABASE_ANON_KEY')
  return createClient(url, key)
}
