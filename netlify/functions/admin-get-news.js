// netlify/functions/admin-get-news.js
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  try {
    const SECRET = process.env.ADMIN_JWT_SECRET;
    if (!SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing ADMIN_JWT_SECRET" })
      };
    }

    // --- AUTH ---
    const auth = event.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized — missing token" })
      };
    }

    const token = auth.split(" ")[1];
    let decoded;

    try {
      decoded = jwt.verify(token, SECRET);
    } catch (err) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid or expired token" })
      };
    }

    if (decoded.role !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Forbidden — admin only" })
      };
    }

    // --- SUPABASE ---
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing Supabase environment variables" })
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { data, error } = await supabase
      .from("news_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({ admin: decoded.email, posts: data })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
