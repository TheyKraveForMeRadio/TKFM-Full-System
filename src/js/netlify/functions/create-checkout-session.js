const tier = (body?.tier || '').toLowerCase()
const surgeActive = body?.surge === true

if (surgeActive && tier !== 'elite') {
  console.warn(
    `🚫 Purchase blocked: tier=${tier}, surge=${surgeActive}`
  )

  return {
    statusCode: 403,
    body: JSON.stringify({
      ok: false,
      error: 'Lower tiers locked during surge',
      requiredTier: 'elite'
    })
  }
}
