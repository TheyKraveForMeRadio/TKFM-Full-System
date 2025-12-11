// netlify/functions/user-verify.js
const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  try {
    const authHeader =
      event.headers.authorization || event.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "No token provided" })
      };
    }

    const token = authHeader.split(" ")[1];

    // PUBLIC user tokens are signed by SUPABASE,
    // so the secret is SUPABASE_JWT_SECRET
    const SECRET = process.env.SUPABASE_JWT_SECRET;

    if (!SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing SUPABASE_JWT_SECRET" })
      };
    }

    // Validate token
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET);
    } catch (err) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid or expired token" })
      };
    }

    // Valid user token
    return {
      statusCode: 200,
      body: JSON.stringify({
        authorized: true,
        user_id: decoded.sub,
        email: decoded.email,
        role: decoded.role || "user"
      })
    };

  } catch (err) {
    console.error("user-verify ERROR:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
