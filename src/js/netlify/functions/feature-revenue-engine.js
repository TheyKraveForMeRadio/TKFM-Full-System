import { getStore } from './_helpers.js'

export async function handler() {
  const mixtapes = await getStore('mixtapes')

  const ranked = mixtapes
    .filter(m => m.featured)
    .sort((a,b)=>(b.featuredViews||0)-(a.featuredViews||0))
    .map((m,i)=>({
      ...m,
      rank: i+1,
      almostTop: i === 1
    }))

  return {
    statusCode: 200,
    body: JSON.stringify(ranked)
  }
}
