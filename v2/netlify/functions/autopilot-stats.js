// netlify/functions/autopilot-stats.js
// Aggregated monetization stats for Autopilot dashboard

import { getStore } from './_helpers.js'

export async function handler() {
  try {
    const stats = (await getStore('stats')) || {}
    const sponsors = (await getStore('sponsors')) || []
    const mixtapes = (await getStore('mixtapes')) || []

    const eliteSold = Number(stats.eliteSold || 0)
    const elitePrice = Number(stats.elitePrice || 100)

    const sponsorsCount = sponsors.length
    const sponsorClicks = sponsors.reduce(
      (sum, s) => sum + Number(s.clicks || 0),
      0
    )

    const featuredViews = mixtapes.reduce(
      (sum, m) => sum + Number(m.featuredViews || 0),
      0
    )

    // Simple rough projections (you can tweak anytime)
    const sponsorCpm = 8 // $8 per 1000 clicks/impressions
    const featureRate = 0.05 // $0.05 per featured view (example)

    const sponsorRevenue = (sponsorClicks / 1000) * sponsorCpm
    const featureRevenue = featuredViews * featureRate
    const eliteRevenue = eliteSold * elitePrice

    const projectedMonthly =
      Math.round((sponsorRevenue + featureRevenue + eliteRevenue) * 100) / 100
    const projectedYearly =
      Math.round(projectedMonthly * 12 * 100) / 100

    const payload = {
      eliteSold,
      elitePrice,
      sponsorsCount,
      sponsorClicks,
      featuredViews,
      sponsorRevenue: Math.round(sponsorRevenue * 100) / 100,
      featureRevenue: Math.round(featureRevenue * 100) / 100,
      eliteRevenue,
      projectedMonthly,
      projectedYearly
    }

    return {
      statusCode: 200,
      body: JSON.stringify(payload)
    }
  } catch (err) {
    console.error('autopilot-stats error:', err)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'server-error' })
    }
  }
}
