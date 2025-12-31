const FN_GET = '/.netlify/functions/get-unlocks';

function $(id){ return document.getElementById(id); }

function mergeFeatures(newFeats) {
  const feats = JSON.parse(localStorage.getItem('tkfm_user_features') || '{}');
  const stamp = Date.now();
  for (const [k,v] of Object.entries(newFeats || {})) {
    feats[k] = v || { ok:true, at: stamp };
  }
  localStorage.setItem('tkfm_user_features', JSON.stringify(feats));
}

async function sync(email) {
  const res = await fetch(FN_GET, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ email })
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.ok) {
    $('status').textContent = 'Sync failed';
    $('out').textContent = JSON.stringify(data, null, 2);
    return;
  }

  if (data.features) mergeFeatures(data.features);
  if (data.tier) localStorage.setItem('tkfm_memberTier', data.tier);

  $('status').textContent = `Synced (${data.rows || 0} purchases)`;
  $('out').textContent = JSON.stringify({ tier: data.tier || null, features: data.features || {} }, null, 2);
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = (localStorage.getItem('tkfm_member_email') || '').trim().toLowerCase();
  if (saved) $('email').value = saved;

  $('btn').addEventListener('click', async () => {
    const email = ($('email').value || '').trim().toLowerCase();
    if (!email) return alert('Enter your email used at checkout');
    localStorage.setItem('tkfm_member_email', email);
    await sync(email);
  });
});
