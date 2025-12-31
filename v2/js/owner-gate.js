(function () {
  const OWNER_KEY = 'tkfm_ownerMode';

  function isOwnerOn() {
    try {
      return localStorage.getItem(OWNER_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function isProtectedPage() {
    const path = (window.location.pathname || '').toLowerCase();
    // Protect these pages
    return (
      path.endsWith('/autopilot-engine.html') ||
      path.endsWith('/ai-dj-engine.html') ||
      path.endsWith('autopilot-engine.html') ||
      path.endsWith('ai-dj-engine.html')
    );
  }

  function injectStyles() {
    const css = `
      body.tkfm-owner-locked {
        filter: grayscale(0.7) brightness(0.6);
      }
      .tkfm-owner-overlay {
        position: fixed;
        inset: 0;
        z-index: 9998;
        background: radial-gradient(circle at top, rgba(15,23,42,0.98) 0, rgba(15,23,42,0.96) 40%, rgba(15,23,42,0.98) 100%);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 80px;
      }
      .tkfm-owner-panel {
        max-width: 480px;
        width: calc(100% - 2.5rem);
        border-radius: 18px;
        border: 1px solid rgba(250,204,21,0.8);
        background: radial-gradient(circle at top, rgba(24,24,27,0.9) 0, rgba(15,23,42,0.96) 55%);
        box-shadow:
          0 24px 60px rgba(0,0,0,0.95),
          0 0 38px rgba(250,204,21,0.5);
        padding: 1.1rem 1.05rem 1rem;
        color: #f9fafb;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
      }
      .tkfm-owner-chip {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: #facc15;
        margin-bottom: 0.4rem;
      }
      .tkfm-owner-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.35rem;
      }
      .tkfm-owner-body {
        font-size: 0.8rem;
        color: #e5e7eb;
        margin-bottom: 0.6rem;
      }
      .tkfm-owner-body strong {
        color: #f97316;
      }
      .tkfm-owner-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 0.6rem;
        align-items: center;
        margin-top: 0.2rem;
      }
      .tkfm-owner-btn-main {
        border-radius: 999px;
        padding: 0.45rem 1.25rem;
        border: 1px solid rgba(250,250,249,0.95);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-weight: 600;
        color: #020617;
        background: radial-gradient(circle at top, #facc15 0, #b45309 60%);
        cursor: pointer;
        box-shadow:
          0 0 18px rgba(250,250,249,0.8),
          0 0 28px rgba(245,158,11,0.85);
      }
      .tkfm-owner-btn-main:hover {
        filter: brightness(1.05);
      }
      .tkfm-owner-btn-ghost {
        border-radius: 999px;
        padding: 0.4rem 1.1rem;
        border: 1px solid rgba(148,163,184,0.9);
        font-size: 0.76rem;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        font-weight: 500;
        color: #cbd5f5;
        background: rgba(15,23,42,0.98);
        cursor: pointer;
      }
      .tkfm-owner-btn-ghost:hover {
        border-color: rgba(250,250,249,0.85);
        color: #f9fafb;
      }
      .tkfm-owner-hint {
        font-size: 0.72rem;
        color: #9ca3af;
        margin-top: 0.3rem;
      }
      .tkfm-owner-hint code {
        font-size: 0.7rem;
      }
      @media (max-width: 480px) {
        .tkfm-owner-panel {
          width: calc(100% - 1.6rem);
        }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function lockPage() {
    if (!document.body) return;

    injectStyles();
    document.body.classList.add('tkfm-owner-locked');

    const overlay = document.createElement('div');
    overlay.className = 'tkfm-owner-overlay';

    const panel = document.createElement('div');
    panel.className = 'tkfm-owner-panel';

    const chip = document.createElement('div');
    chip.className = 'tkfm-owner-chip';
    chip.textContent = 'Owner mode required';

    const title = document.createElement('div');
    title.className = 'tkfm-owner-title';
    title.textContent = 'This page is for TKFM GOD VIEW only.';

    const body = document.createElement('div');
    body.className = 'tkfm-owner-body';
    body.innerHTML =
      'To use this internal engine, first turn on <strong>Owner Mode</strong> from the Owner Login page. ' +
      'Once it\'s on, come back here through the App Hub.';

    const actions = document.createElement('div');
    actions.className = 'tkfm-owner-actions';

    const btnLogin = document.createElement('button');
    btnLogin.className = 'tkfm-owner-btn-main';
    btnLogin.textContent = 'Open Owner Login';
    btnLogin.addEventListener('click', function () {
      window.location.href = 'owner-login.html';
    });

    const btnHub = document.createElement('button');
    btnHub.className = 'tkfm-owner-btn-ghost';
    btnHub.textContent = 'Go to App Hub';
    btnHub.addEventListener('click', function () {
      window.location.href = 'app-hub.html';
    });

    actions.appendChild(btnLogin);
    actions.appendChild(btnHub);

    const hint = document.createElement('div');
    hint.className = 'tkfm-owner-hint';
    hint.innerHTML =
      'Dev note: this checks <code>' + OWNER_KEY + '</code> in <strong>localStorage</strong>. ' +
      'Owner Login page flips that flag on/off.';

    panel.appendChild(chip);
    panel.appendChild(title);
    panel.appendChild(body);
    panel.appendChild(actions);
    panel.appendChild(hint);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  function init() {
    if (!isProtectedPage()) return;
    if (isOwnerOn()) return;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', lockPage);
    } else {
      lockPage();
    }
  }

  init();
})();
