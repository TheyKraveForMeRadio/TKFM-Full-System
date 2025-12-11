// netlify/functions/admin-auth.js
const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body || "{}");

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email and password required" }),
      };
    }

    // Environment variables from Netlify / .env
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const SECRET = process.env.ADMIN_JWT_SECRET;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Server missing admin credentials",
        }),
      };
    }

    // Validate credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid admin credentials" }),
      };
    }

    // Create JWT token valid for 7 days
    const token = jwt.sign(
      { role: "admin", email },
      SECRET,
      { expiresIn: "7d" }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ token }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
