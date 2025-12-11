// netlify/functions/editor-edit-news.js
const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  try {
    // Require PATCH or PUT
    if (event.httpMethod !== "PATCH" && event.httpMethod !== "PUT") {
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

    // Editors + Admins allowed
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

    const { id, title, image, content, author } = JSON.parse(event.body || "{}");

    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing news ID" })
      };
    }

    const fieldsToUpdate = {};
    if (title) fieldsToUpdate.title = title;
    if (image) fieldsToUpdate.image = image;
    if (content) fieldsToUpdate.content = content;
    if (author) fieldsToUpdate.author = author;

    if (Object.keys(fieldsToUpdate).length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No fields provided for update" })
      };
    }

    await knex("news")
      .where({ id })
      .update({
        ...fieldsToUpdate,
        updated_at: knex.fn.now()
      });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "News updated" })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
