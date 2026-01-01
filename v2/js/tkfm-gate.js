// TKFM: Universal page gate
// Usage:
//   <body data-requires="creator_pass_monthly,autopilot_pro_monthly"> ...
// Optional:
//   data-gate-title="Autopilot Pro Required"
//   data-gate-message="Upgrade to unlock this engine."
//
// Behavior:
// - Runs syncEntitlements() first
// - If entitlement status is canceled/past_due and requires a subscription, blocks
// - If required plan IDs not in tkfm_user_features, blocks
// - Redirect button -> /pricing.html

import { syncEntitlements, getLocalUnlocks, getEntitlementStatus } from './tkfm-entitlements-sync.js';

function parseReq() {
  const raw = document.body.getAttribute('data-requires') || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function hasAll(unlocks, req) {
  const set = new Set((unlocks || []).map(String));
  return req.every(r => set.has(String(r)));
}

function renderGate(title, message) {
  const bg = '#020617';
  const txt = '#e5e7eb';

  document.documentElement.style.background = bg;
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:${bg};color:${txt};font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif">
      <div style="max-width:860px;width:100%;border:1px solid rgba(255,255,255,.10);border-radius:18px;padding:22px;background:rgba(2,6,23,.55);backdrop-filter: blur(10px)">
        <div style="font-size:26px;margin:0 0 10px">${title}</div>
        <div style="opacity:.9;margin:0 0 14px">${message}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a href="/pricing.html" style="display:inline-block;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);text-decoration:none;color:${txt};background:rgba(255,255,255,.06)">Go to Pricing</a>
          <a href="/radio-hub.html" style="display:inline-block;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.14);text-decoration:none;color:${txt};background:rgba(255,255,255,.06)">Radio Hub</a>
        </div>
        <div style="opacity:.75;font-size:13px;margin-top:12px">
          This page requires active access. If you already purchased, complete checkout and return to <code style="background:rgba(0,0,0,.25);padding:2px 6px;border-radius:8px">/success.html</code>.
        </div>
      </div>
    </div>
  `;
}

function isBadStatus(status) {
  const s = String(status || '').toLowerCase();
  return s === 'canceled' || s === 'past_due';
}

document.addEventListener('DOMContentLoaded', async () => {
  const req = parseReq();
  if (!req.length) return; // page not gated

  const title = document.body.getAttribute('data-gate-title') || '🔒 Access Required';
  const message = document.body.getAttribute('data-gate-message') || 'Upgrade to unlock this engine.';

  // Sync server entitlements first (non-blocking if backend not enabled)
  try { await syncEntitlements(); } catch(_) {}

  const unlocks = getLocalUnlocks();
  const status = getEntitlementStatus();

  if (isBadStatus(status)) {
    renderGate(title, 'Your subscription status is not active. Please update billing or repurchase access.');
    return;
  }

  if (!hasAll(unlocks, req)) {
    renderGate(title, message);
    return;
  }
});
