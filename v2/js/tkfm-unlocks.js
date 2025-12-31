// TKFM Unlock + Checkout Brain — FULL FILE

(function () {
  if (typeof window === 'undefined') return;

  const PROFILE_KEY = 'tkfm_user_profile';
  const FEATURES_KEY = 'tkfm_user_features';

  function safeParse(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      const v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch {
      return fallback;
    }
  }

  function safeWrite(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  function getProfile() {
    const profile = safeParse(PROFILE_KEY, null);
    if (!profile || typeof profile !== 'object') return { plan: 'free' };
    return profile;
  }

  function setProfile(profile) {
    if (profile && typeof profile === 'object') safeWrite(PROFILE_KEY, profile);
  }

  function getFeatures() {
    const list = safeParse(FEATURES_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function addFeature(id) {
    if (!id) return;
    const list = getFeatures();
    if (!list.includes(id)) {
      list.push(id);
      safeWrite(FEATURES_KEY, list);
    }
  }

  function hasFeature(id) {
    if (!id) return false;
    return getFeatures().includes(id);
  }

  function isPaidTier(profile) {
    const paid = new Set([
      'creator_pass_monthly',
      'creator_pass_yearly',
      'motion_monthly',
      'takeover_viral_monthly',
      'dj_toolkit_monthly',
      'label_core_monthly',
      'label_pro_monthly',
      'owner_founder_access'
    ]);

    if (!profile) return false;
    const plan = profile.plan || profile.currentPlan || profile.tier || '';
    return paid.has(String(plan));
  }

  // Handle ?unlocked=feature_id[,feature_two]
  function applyUnlockFromURL() {
    try {
      const url = new URL(window.location.href);
      const u = url.searchParams.get('unlocked');
      if (!u) return;
      u.split(',').forEach(id => addFeature(id.trim()));
      url.searchParams.delete('unlocked');
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }

  function startCheckout(opts, btn) {
    const payload = {};
    if (opts.plan) payload.plan = opts.plan;
    if (opts.feature) payload.feature = opts.feature;

    if (!payload.plan && !payload.feature) {
      alert('Missing plan/feature ID.');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.6';
    }

    fetch('/.netlify/functions/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(r => r.json())
      .then(data => {
        if (data.url) {
          window.location = data.url;
        } else {
          alert('Stripe failed: no URL returned.');
        }
      })
      .catch(err => {
        alert(err.message || 'Checkout failed.');
      })
      .finally(() => {
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '';
        }
      });
  }

  // EXPORT
  window.TKFMAccess = {
    getProfile,
    setProfile,
    getFeatures,
    addFeature,
    hasFeature,
    isPaidTier,
    applyUnlockFromURL,
    startCheckout
  };

  // AUTO WIRE
  document.addEventListener('DOMContentLoaded', () => {
    applyUnlockFromURL();
    document
      .querySelectorAll('.js-checkout[data-plan], .js-checkout[data-feature]')
      .forEach(btn => {
        btn.addEventListener('click', e => {
          e.preventDefault();
          const plan = btn.dataset.plan || null;
          const feature = btn.dataset.feature || null;
          startCheckout({ plan, feature }, btn);
        });
      });
  });
})();
