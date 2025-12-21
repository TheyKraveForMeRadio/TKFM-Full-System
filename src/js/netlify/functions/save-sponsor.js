import { v4 as uuidv4 } from 'uuid'
import { getStore, setStore } from './_helpers.js'

export async function handler(event) {
  const body = JSON.parse(event.body)

  const sponsors = await getStore('sponsors')

  // 🔒 LOCK ONE SPONSOR PER CATEGORY
  if (sponsors.find(s => s.category === body.category)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Category already taken' })
    }
  }

  const sponsor = {
    id: uuidv4(),
    brandName: body.brandName,
    category: body.category,
    logoUrl: body.logoUrl,
    website: body.website,
    createdAt: Date.now(),

    active: true,
    plan: body.plan, // starter | pro | elite
    impressions: 0
  }

  sponsors.unshift(sponsor)
  await setStore('sponsors', sponsors)

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, sponsor })
  }
}
