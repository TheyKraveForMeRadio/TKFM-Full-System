function tkfmGetFeats() {
  try { return JSON.parse(localStorage.getItem('tkfm_user_features') || '{}') || {}; }
  catch { return {}; }
}

function tkfmHasFeature(id) {
  const feats = tkfmGetFeats();
  return !!(feats[id] && feats[id].ok);
}

function tkfmTier() {
  return (localStorage.getItem('tkfm_memberTier') || 'free').toLowerCase();
}

function tkfmAllowTier(required) {
  const t = tkfmTier();
  const order = { free:0, fan:1, creator:2, dj:3, label:4, owner:9 };
  const need = (required || 'free').toLowerCase();
  return (order[t] ?? 0) >= (order[need] ?? 0);
}

function tkfmGoPricing(reason) {
  try { localStorage.setItem('tkfm_return_url', location.pathname + location.search + location.hash); } catch {}
  const r = encodeURIComponent(reason || 'locked');
  location.href = `/pricing.html?locked=${r}`;
}

function tkfmRequire(opts={}) {
  const { feature, tier, anyFeatures } = opts;

  if (tier && !tkfmAllowTier(tier)) tkfmGoPricing(`tier_${tier}`);

  if (feature && !tkfmHasFeature(feature)) tkfmGoPricing(`feature_${feature}`);

  if (Array.isArray(anyFeatures) && anyFeatures.length) {
    const ok = anyFeatures.some(tkfmHasFeature);
    if (!ok) tkfmGoPricing(`feature_any`);
  }
}

window.TKFM_GUARD = { requireAccess: tkfmRequire, hasFeature: tkfmHasFeature, tier: tkfmTier };
