import jwt from "jsonwebtoken";

export function requireAuth(event) {
  const token = event.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ success: false, error: "Missing token" }) };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    return { statusCode: 403, body: JSON.stringify({ success: false, error: "Invalid token" }) };
  }
}

export function verifyAdmin(event) {
  const token = event.headers.authorization?.replace("Bearer ", "");
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ success: false, error: "Missing admin token" }) };
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    return decoded;
  } catch (err) {
    return { statusCode: 403, body: JSON.stringify({ success: false, error: "Invalid admin token" }) };
  }
}
