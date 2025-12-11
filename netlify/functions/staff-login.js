// netlify/functions/staff-login.js
const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body || "{}");

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email and password required" })
      };
    }

    // Staff credentials (NOT admin)
    const STAFF_EMAIL = process.env.STAFF_EMAIL;
    const STAFF_PASSWORD = process.env.STAFF_PASSWORD;
    const SECRET = process.env.STAFF_JWT_SECRET;

    if (!STAFF_EMAIL || !STAFF_PASSWORD || !SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server missing staff credentials" })
      };
    }

    if (email !== STAFF_EMAIL || password !== STAFF_PASSWORD) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid staff credentials" })
      };
    }

    // Staff signed JWT — only staff role
    const token = jwt.sign(
      { role: "staff", email },
      SECRET,
      { expiresIn: "7d" }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ token })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
