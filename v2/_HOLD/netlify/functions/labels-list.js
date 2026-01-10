import { getStore, setStore } from './_helpers.js'

export async function handler(event) {
  const adminKey = process.env.TKFM_OWNER_KEY
  const sentKey = event.headers['x-tkfm-key']

  if (adminKey && sentKey !== adminKey) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) }
  }

  const method = event.httpMethod
  let labels = (await getStore('labels')) || []

  // GET → fetch list
  if (method === "GET") {
    labels.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''))
    return { statusCode: 200, body: JSON.stringify({ labels }) }
  }

  // POST → add new label
  if (method === "POST") {
    const body = JSON.parse(event.body)
    const newLabel = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString()
    }
    labels.push(newLabel)
    await setStore('labels', labels)
    return { statusCode: 200, body: JSON.stringify({ ok: true, label: newLabel }) }
  }

  return { statusCode: 405, body: "Method Not Allowed" }
}
