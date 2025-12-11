// netlify/functions/admin-delete-news.js
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "DELETE") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    // --- AUTH CHECK ---
    const SECRET = process.env.ADMIN_JWT_SECRET;

    const authHeader = event.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized — missing token" })
      };
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], SECRET);
    } catch {
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

    // --- INPUT ---
    const { id } = JSON.parse(event.body || "{}");

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing news post ID" })
      };
    }

    // --- SUPABASE ---
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { error } = await supabase
      .from("news_posts")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "News post deleted successfully",
        id
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
