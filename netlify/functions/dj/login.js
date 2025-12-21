import jwt from "jsonwebtoken"

export const handler = async (event) => {
  try {
    const { email, password } = JSON.parse(event.body)

    // TEMP DJ ACCESS (SAFE FOR LAUNCH)
    if (email !== "dj@tkfm.radio" || password !== "djaccess") {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Invalid DJ credentials" })
      }
    }

    const token = jwt.sign(
      { role: "dj", email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    )

    return {
      statusCode: 200,
      body: JSON.stringify({ token })
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "DJ login failed" })
    }
  }
}
