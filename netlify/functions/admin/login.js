import jwt from 'jsonwebtoken'

export const handler = async (event) => {
  const { email, password } = JSON.parse(event.body || '{}')

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return {
      statusCode: 401,
      body: JSON.stringify({ ok: false, error: 'Invalid credentials' })
    }
  }

  const token = jwt.sign(
    { role: 'admin', email },
    process.env.JWT_SECRET,
    { expiresIn: '6h' }
  )

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, token })
  }
}
