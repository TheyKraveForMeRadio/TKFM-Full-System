// netlify/functions/admin-verify.js
const jwt = require('jsonwebtoken');

exports.handler = async function(event) {
  try {
    const SECRET = process.env.ADMIN_JWT_SECRET;
    if (!SECRET) return { statusCode: 500, body: JSON.stringify({ error: 'Missing JWT secret' }) };

    const auth = event.headers && (event.headers.authorization || event.headers.Authorization);
    if (!auth || !auth.startsWith('Bearer ')) return { statusCode: 401, body: JSON.stringify({ error: 'No token' }) };
    const token = auth.split(' ')[1];

    const decoded = jwt.verify(token, SECRET);
    if (!decoded || decoded.role !== 'admin') return { statusCode: 403, body: JSON.stringify({ error: 'Forbidden' }) };

    return { statusCode: 200, body: JSON.stringify({ authorized: true, email: decoded.email }) };
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired token' }) };
  }
};
