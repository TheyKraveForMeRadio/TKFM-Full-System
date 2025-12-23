// TKFM Feature Badge — ENTERPRISE LOCKED

function safeTier(tier) {
  const allowed = new Set(['basic', 'pro', 'elite'])
  return allowed.has(tier) ? tier : null
}

function escapeHTML(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function renderFeatureBadge(mixtape) {
  if (!mixtape || mixtape.featured !== true) return ''

  const tier = safeTier(mixtape.featureTier)
  if (!tier) return ''

  const badges = {
    basic: '🔥 FEATURED',
    pro: '💎 PRO FEATURE',
    elite: '👑 ELITE FEATURE',
  }

  const label = escapeHTML(badges[tier])

  return `
    <div class="tkfm-feature-badge tier-${tier}">
      ${label}
    </div>
  `
}
