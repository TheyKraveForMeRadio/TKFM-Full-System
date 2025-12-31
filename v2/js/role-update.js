// js/role-update.js
//
// Helper to map Stripe plan / lookup keys to TKFM roles.
// Call this after a successful checkout and store the result
// in your `users` JSON store as `user.role`.

export function assignRoleFromPlan(planLookupKey = '') {
  const key = String(planLookupKey).toLowerCase()

  // OWNER (manual)
  if (key.includes('owner')) return 'owner'

  // DJ ELITE / LABEL ENTERPRISE — allowed into AI DJ
  if (key.includes('dj_elite')) return 'dj_elite'
  if (key.includes('label_enterprise')) return 'label_enterprise'

  // Other plans (examples, adjust to your catalog naming)
  if (key.includes('dj_basic')) return 'dj_basic'
  if (key.includes('artist_basic')) return 'artist_basic'
  if (key.includes('artist_elite')) return 'artist_elite'
  if (key.includes('label_basic')) return 'label_basic'

  // Default fallback
  return 'free'
}
