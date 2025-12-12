// netlify/functions/staff-verify.js
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  try {
    const SECRET = process.env.STAFF_JWT_SECRET;

    if (!SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing staff JWT secret" })
      };
    }

    // Get the Authorization header
    const authHeader =
      event.headers.authorization ||
      event.headers.Authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "No token provided" })
      };
    }

    const token = authHeader.split(" ")[1];

    // Verify the staff token
    const decoded = jwt.verify(token, SECRET);

    if (!decoded || decoded.role !== "staff") {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "Forbidden — invalid role" })
      };
    }

    // Success
    return {
      statusCode: 200,
      body: JSON.stringify({
        authorized: true,
        email: decoded.email,
        role: decoded.role
      })
    };

  } catch (err) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid or expired token" })
    };
  }
};
