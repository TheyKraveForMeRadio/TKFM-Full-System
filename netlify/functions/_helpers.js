import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars (SUPABASE_URL or SUPABASE_KEY)");
  return createClient(url, key);
}

export function verifyAdmin(event) {
  const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || "";
  if (!auth) throw new Error("Missing Authorization header");
  const parts = auth.split(" ");
  const token = parts.length > 1 ? parts[1] : parts[0];
  if (!token) throw new Error("Invalid Authorization header");

  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing ADMIN_JWT_SECRET environment variable");

  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch (e) {
    throw new Error("Invalid token: " + e.message);
  }

  const isAdmin = payload && (payload.role === "admin" || payload.is_admin === true || payload.is_admin === "true");
  if (!isAdmin) throw new Error("User is not admin");
  return payload;
}

export function safeJson(body) {
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  };
}
