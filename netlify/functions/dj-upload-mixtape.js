// netlify/functions/dj-upload-mixtape.js
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Token check
    const authHeader = event.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "");
    const SECRET = process.env.ADMIN_JWT_SECRET;

    if (!token || !SECRET) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" })
      };
    }

    let user;
    try {
      user = jwt.verify(token, SECRET);
    } catch (err) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid token" })
      };
    }

    // Only Admin or DJ can upload mixtapes
    if (user.role !== "dj" && user.role !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Forbidden" })
      };
    }

    import knex from 'knex';({
      client: "sqlite3",
      connection: { filename: "./sql/tkfm.db" },
      useNullAsDefault: true
    });

    // POST body
    const { title, artist, fileUrl, coverUrl } = JSON.parse(event.body || "{}");

    if (!title || !artist || !fileUrl) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "title, artist, fileUrl required" })
      };
    }

    const id = await knex("mixtapes").insert({
      title,
      artist,
      file_url: fileUrl,
      cover_url: coverUrl || null,
      uploaded_by: user.email,
      created_at: new Date().toISOString()
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
