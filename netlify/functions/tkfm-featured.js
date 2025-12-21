export function renderFeatureBadge(mixtape) {
  if (!mixtape.featured) return ''

  const badges = {
    basic: '🔥 FEATURED',
    pro: '💎 PRO FEATURE',
    elite: '👑 ELITE FEATURE'
  }

  return `
    <div class="tkfm-feature-badge ${mixtape.featureTier}">
      ${badges[mixtape.featureTier]}
    </div>
  `
}
