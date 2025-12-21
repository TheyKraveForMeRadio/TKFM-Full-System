if (body.surge && body.tier !== 'elite') {
  return {
    statusCode: 403,
    body: JSON.stringify({
      error: 'Lower tiers locked during surge'
    })
  }
}
