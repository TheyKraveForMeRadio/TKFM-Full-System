import { getStore } from "./_helpers.js"

export async function handler() {
  const sponsors = (await getStore("sponsors")) || []

  const items = sponsors
    .filter(s => s.active === true)
    .map(s => ({
      // ✅ PUBLIC-SAFE FIELDS ONLY
      id: s.id,
      name: s.name,
      logoUrl: s.logoUrl || null,
      link: s.link || null,
      tier: s.tier || null
    }))

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300"
    },
    body: JSON.stringify({
      ok: true,
      total: items.length,
      items
    })
  }
}
