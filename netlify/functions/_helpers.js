// netlify/functions/_helpers.js
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_KEY;
  if (!url || !key) throw new Error('Missing Supabase environment variables (SUPABASE_URL / SUPABASE_ANON_KEY)');
  return createClient(url, key);
}

function signToken(payload, secret, opts = {}) {
  if (!secret) throw new Error('Missing JWT secret');
  return jwt.sign(payload, secret, opts);
}

function verifyToken(token, secret) {
  if (!secret) throw new Error('Missing JWT secret');
  return jwt.verify(token, secret);
}

function getBearerToken(event) {
  const header = event.headers && (event.headers.authorization || event.headers.Authorization);
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

function requireAdmin(event) {
  const token = getBearerToken(event);
  if (!token) throw new Error('No token');
  const secret = process.env.ADMIN_JWT_SECRET;
  const payload = verifyToken(token, secret);
  if (!payload || payload.role !== 'admin') throw new Error('Unauthorized - admin required');
  return payload;
}

function requireStaffOrAdmin(event) {
  const token = getBearerToken(event);
  if (!token) throw new Error('No token');
  const secret = process.env.STAFF_JWT_SECRET || process.env.ADMIN_JWT_SECRET;
  const payload = verifyToken(token, secret);
  if (!payload || (payload.role !== 'staff' && payload.role !== 'editor' && payload.role !== 'dj' && payload.role !== 'admin')) {
    throw new Error('Unauthorized - staff/editor/dj/admin required');
  }
  return payload;
}

export default {
  getSupabase,
  signToken,
  verifyToken,
  getBearerToken,
  requireAdmin,
  requireStaffOrAdmin
};
