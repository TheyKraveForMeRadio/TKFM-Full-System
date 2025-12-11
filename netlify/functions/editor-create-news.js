// netlify/functions/editor-create-news.js
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
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

    // Decode JWT
    let decoded;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], SECRET);
    } catch {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid or expired token" })
      };
    }

    // Allow admin OR editor
    if (decoded.role !== "editor" && decoded.role !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Forbidden — editors only" })
      };
    }

    // --- INPUT ---
    const { title, body, author } = JSON.parse(event.body || "{}");

    if (!title || !body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing required fields: title, body"
        })
      };
    }

    // --- SUPABASE ---
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from("news_posts")
      .insert([
        {
          title,
          body,
          author: author || decoded.email,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "News post created successfully",
        post: data
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
