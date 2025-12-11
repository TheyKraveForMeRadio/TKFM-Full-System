// netlify/functions/editor-delete-news.js
const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  try {
    // Require DELETE
    if (event.httpMethod !== "DELETE") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    // Validate token
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
    } catch {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid token" })
      };
    }

    // Only Admin + Editor allowed
    if (user.role !== "editor" && user.role !== "admin") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Forbidden" })
      };
    }

    const knex = require("knex")({
      client: "sqlite3",
      connection: { filename: "./sql/tkfm.db" },
      useNullAsDefault: true
    });

    const { id } = JSON.parse(event.body || "{}");

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing news ID" })
      };
    }

    // Perform delete
    await knex("news")
      .where({ id })
      .del();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "News deleted" })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
