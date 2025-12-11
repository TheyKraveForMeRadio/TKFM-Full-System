// netlify/functions/admin-update-news.js
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "PUT") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    // --- AUTH ---
    const SECRET = process.env.ADMIN_JWT_SECRET;
    const auth = event.headers.authorization || "";

    if (!auth.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized — missing token" })
      };
    }

    let decoded;
    try {
      decoded = jwt.verify(auth.split(" ")[1], SECRET);
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
    const { id, title, body, image_url } = JSON.parse(event.body || "{}");

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing news post ID" })
      };
    }

    // Only update fields provided
    const updateData = {};
    if (title) updateData.title = title;
    if (body) updateData.body = body;
    if (image_url !== undefined) updateData.image_url = image_url;
    updateData.updated_at = new Date().toISOString();

    // --- SUPABASE ---
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from("news_posts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "News post updated successfully",
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
