function getUnlocks() {
  try {
    const v = JSON.parse(localStorage.getItem('tkfm_user_features') || '[]');
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

function hasTier(unlocks, tierId) {
  return unlocks.includes(tierId);
}

function tierFromUnlocks(unlocks) {
  if (hasTier(unlocks, 'mixtape_hosting_elite')) return 'ELITE';
  if (hasTier(unlocks, 'mixtape_hosting_pro')) return 'PRO';
  if (hasTier(unlocks, 'mixtape_hosting_starter')) return 'STARTER';
  return null;
}

async function submitOrder(payload) {
  const res = await fetch('/.netlify/functions/submit-mixtape-order', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data?.error || 'submit_failed');
  return data.order;
}

function $(id){ return document.getElementById(id); }

document.addEventListener('DOMContentLoaded', () => {
  const unlocks = getUnlocks();
  const tier = tierFromUnlocks(unlocks);

  const gate = $('gate');
  const formWrap = $('formWrap');
  const tierEl = $('tier');
  const statusEl = $('status');

  if (!tier) {
    gate.style.display = 'block';
    formWrap.style.display = 'none';
    return;
  }

  gate.style.display = 'none';
  formWrap.style.display = 'block';
  tierEl.textContent = tier;

  $('orderForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Submitting…';

    const payload = {
      tier,
      artistName: $('artistName').value.trim(),
      email: $('email').value.trim(),
      phone: $('phone').value.trim(),
      mixtapeTitle: $('mixtapeTitle').value.trim(),
      download: $('download').value.trim(),
      tracklist: $('tracklist').value.trim(),
      socials: $('socials').value.trim(),
      notes: $('notes').value.trim()
    };

    try {
      const order = await submitOrder(payload);
      statusEl.textContent = '✅ Submitted. Your order id: ' + order.id;
      $('orderForm').reset();
    } catch (err) {
      statusEl.textContent = '❌ Error: ' + (err?.message || 'submit_failed');
    }
  });
});
