import { getStore } from "./_helpers.js"

export async function handler() {
  const artists = (await getStore("artists")) || []
  const now = Date.now()

  const items = artists
    .filter(a => a.featured === true && Number(a.spotlightExpiresAt) > now)
    .map(a => ({
      // ✅ PUBLIC-SAFE FIELDS ONLY
      id: a.id,
      name: a.name,
      imageUrl: a.imageUrl || a.photoUrl || null,
      bio: a.bio || null,
      totalViews: Number(a.totalViews) || 0,
      spotlightExpiresAt: Number(a.spotlightExpiresAt) || null
    }))

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=120"
    },
    body: JSON.stringify({
      ok: true,
      total: items.length,
      items
    })
  }
}
