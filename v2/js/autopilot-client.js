// js/autopilot-client.js
// Frontend wiring for Autopilot Monetization dashboard

function setText(id, value) {
  const el = document.getElementById(id)
  if (!el) return
  el.textContent = value
}

export async function initAutopilotDashboard() {
  try {
    const res = await fetch('/.netlify/functions/autopilot-stats')
    if (!res.ok) throw new Error('Failed to load autopilot stats')

    const data = await res.json()

    setText('eliteSold', data.eliteSold ?? '0')
    setText('elitePrice', data.elitePrice != null ? `$${data.elitePrice}` : '$0')
    setText(
      'eliteRevenue',
      data.eliteRevenue != null ? `$${data.eliteRevenue.toFixed(2)}` : '$0.00'
    )

    setText('sponsorCount', data.sponsorsCount ?? '0')
    setText('sponsorClicks', data.sponsorClicks ?? '0')
    setText(
      'sponsorRevenue',
      data.sponsorRevenue != null ? `$${data.sponsorRevenue.toFixed(2)}` : '$0.00'
    )

    setText('featuredViews', data.featuredViews ?? '0')
    setText(
      'featureRevenue',
      data.featureRevenue != null ? `$${data.featureRevenue.toFixed(2)}` : '$0.00'
    )

    setText(
      'projectedMonthly',
      data.projectedMonthly != null ? `$${data.projectedMonthly.toFixed(2)}` : '$0.00'
    )
    setText(
      'projectedYearly',
      data.projectedYearly != null ? `$${data.projectedYearly.toFixed(2)}` : '$0.00'
    )
  } catch (err) {
    console.error('initAutopilotDashboard error:', err)
    const warning = document.getElementById('autopilot-error')
    if (warning) {
      warning.classList.remove('hidden')
    }
  }
}
