import { getStore, setStore } from './_helpers.js'

export async function handler() {
  const mixes = await getStore('mixtapes')

  const featured = mixes.filter(m => m.featured)
  featured.sort((a,b)=>(b.featuredViews||0)-(a.featuredViews||0))

  featured.forEach((m,i)=>{
    if (i === 1 && m.featureTier === 'pro') {
      m.recommendUpgrade = true
    }
  })

  await setStore('mixtapes', mixes)
  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}
