import { getStore, setStore } from './_helpers.js'

export async function handler() {
  const sponsors = await getStore('sponsors')
  if (!sponsors.length) return { statusCode:200, body:'none' }

  sponsors.push(sponsors.shift())
  await setStore('sponsors', sponsors)

  return { statusCode:200, body:'rotated' }
}
