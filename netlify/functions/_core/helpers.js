import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'

/* ================================
   🔐 ENV
================================ */
const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  JWT_SECRET
} = process.env

/* ================================
   🧠 IN-MEMORY STORE FALLBACK
   (used by mixtapes, features, etc.)
================================ */
const memoryStore = {}

export async function getStore(key) {
  if (!memoryStore[key]) memoryStore[key] = []
  return memoryStore[key]
}

export async function setStore(key, value) {
  memoryStore[key] = value
  return true
}

/* ================================
   🧩 SUPABASE CLIENT (FIX)
================================ */
export function createSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env vars missing')
  }

  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY
  )
}

/* ================================
   🔐 AUTH HELPERS
================================ */
export function verifyToken(authHeader) {
  if (!authHeader) throw new Error('No auth header')

  const token = authHeader.replace('Bearer ', '')
  return jwt.verify(token, JWT_SECRET)
}

export function verifyAdmin(authHeader) {
  const user = verifyToken(authHeader)

  if (!user || user.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return user
}

export function verifyEditor(authHeader) {
  const user = verifyToken(authHeader)

  if (!['admin', 'editor'].includes(user.role)) {
    throw new Error('Editor access required')
  }

  return user
}
