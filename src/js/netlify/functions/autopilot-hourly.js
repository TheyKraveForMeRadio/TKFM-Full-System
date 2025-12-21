import { getStore, setStore } from './_helpers.js'

export async function handler() {
  const mixtapes = await getStore('mixtapes')

  const featured = mixtapes.filter(m => m.featured)
  if (!featured.length) return { statusCode: 200, body: 'no-featured' }

  featured.sort((a,b)=>(b.featuredViews||0)-(a.featuredViews||0))

  featured.forEach((m,i)=>{
    m.rank = i+1
    m.homepagePin = i === 0
  })

  await setStore('mixtapes', mixtapes)

  return {
    statusCode: 200,
    body: JSON.stringify({ ok:true, promoted:true })
  }
}
