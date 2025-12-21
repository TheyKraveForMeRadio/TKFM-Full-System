window.payFeature = async function ({ mixtapeId, priceId, tier }) {
  const res = await fetch('/.netlify/functions/create-feature-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mixtapeId, priceId, tier })
  })

  const { url } = await res.json()
  window.location.href = url
}
