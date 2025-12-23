// netlify/functions/public-get-mixtapes.js — ENTERPRISE LOCKED
import { preflight, json, getStore } from './_helpers.js'

function stripPrivate(m) {
  // Only return fields that public pages need
  return {
    id: m.id,
    title: m.title,
    djName: m.djName,
    artist: m.artist || null,

    audioUrl: m.audioUrl,
    coverUrl: m.coverUrl || null,

    // feature fields
    featured: m.featured === true,
    featureTier: m.featureTier || null,
    featureExpiresAt: m.featureExpiresAt || null,
    featuredViews: Number(m.featuredViews || 0),
    homepagePin: m.homepagePin === true,

    // AI ranking fields (public safe)
    aiScore: Number(m.aiScore || 0),

    createdAt: m.createdAt || null,
  }
}

export const handler = async (event) => {
  const pf = preflight(event)
  if (pf) return pf

  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' })

  const now = Date.now()
  const store = await getStore('mixtapes', [])

  // Ensure array
  const mixtapes = Array.isArray(store) ? store : []

  // Server-side enforcement:
  // - expire features if past expiry (public view should never show expired as featured)
  // - never leak admin/dj audit fields
  const data = mixtapes
    .map((m) => {
      const out = { ...(m || {}) }

      const exp = Number(out.featureExpiresAt || 0)
      if (out.featured === true && exp && exp < now) {
        out.featured = false
        out.featureTier = null
        out.featureExpiresAt = null
        out.homepagePin = false
      }

      return stripPrivate(out)
    })
    // Keep stable ordering (newest first) unless your UI sorts differently
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))

  return json(
    200,
    { ok: true, data },
    {
      // Safe caching for public lists (tune if you want near-realtime)
      'Cache-Control': 'public, max-age=30',
    }
  )
}

