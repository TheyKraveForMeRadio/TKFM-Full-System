import { v2 as cloudinary } from "cloudinary"
import jwt from "jsonwebtoken"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export const handler = async (event) => {
  try {
    const token = event.headers.authorization?.replace("Bearer ", "")
    if (!token) throw new Error("No token")

    jwt.verify(token, process.env.JWT_SECRET)

    const { file } = JSON.parse(event.body)

    const upload = await cloudinary.uploader.upload(file, {
      resource_type: "video"
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: upload.secure_url
      })
    }
  } catch (err) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Upload failed" })
    }
  }
}
