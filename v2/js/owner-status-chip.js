(function () {
  const OWNER_KEY = 'tkfm_ownerMode';

  function isInternalPage() {
    const path = (window.location.pathname || '').toLowerCase();
    return (
      path.endsWith('/autopilot-engine.html') ||
      path.endsWith('/ai-dj-engine.html') ||
      path.endsWith('autopilot-engine.html') ||
      path.endsWith('ai-dj-engine.html')
    );
  }

  function isOwnerOn() {
    try {
      return localStorage.getItem(OWNER_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  function injectStyles() {
    const css = `
      .tkfm-owner-chip-fixed {
        position: fixed;
        inset: 1rem 1rem auto auto;
        z-index: 9990;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        border-radius: 999px;
        padding: 0.28rem 0.7rem;
        border: 1px solid rgba(148,163,184,0.9);
        background: radial-gradient(circle at top, rgba(15,23,42,0.98) 0, rgba(15,23,42,0.96) 55%);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif;
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.16em;
        color: #e5e7eb;
        box-shadow:
          0 14px 30px rgba(15,23,42,0.9),
          0 0 20px rgba(15,23,42,0.8);
        cursor: default;
      }
      .tkfm-owner-chip-fixed.on {
        border-color: rgba(74,222,128,0.9);
        color: #bbf7d0;
        box-shadow:
          0 14px 30px rgba(15,23,42,0.9),
          0 0 20px rgba(74,222,128,0.7);
      }
      .tkfm-owner-chip-dot {
        width: 0.44rem;
        height: 0.44rem;
        border-radius: 999px;
        background: radial-gradient(circle, #facc15 0, #854d0e 75%);
        box-shadow: 0 0 8px rgba(250,204,21,0.9);
      }
      .tkfm-owner-chip-fixed.on .tkfm-owner-chip-dot {
        background: radial-gradient(circle, #4ade80 0, #166534 75%);
        box-shadow: 0 0 8px rgba(74,222,128,0.9);
      }
      .tkfm-owner-chip-link {
        margin-left: 0.35rem;
        font-size: 0.7rem;
        color: #bae6fd;
        text-decoration: none;
        cursor: pointer;
      }
      .tkfm-owner-chip-link:hover {
        text-decoration: underline;
      }
      @media (max-width: 640px) {
        .tkfm-owner-chip-fixed {
          inset: auto 0.75rem 0.9rem auto;
          padding-inline: 0.65rem;
        }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function renderChip() {
    if (!document.body) return;

    injectStyles();

    const existing = document.querySelector('.tkfm-owner-chip-fixed');
    if (existing) existing.remove();

    const on = isOwnerOn();

    const chip = document.createElement('div');
    chip.className = 'tkfm-owner-chip-fixed' + (on ? ' on' : '');

    const dot = document.createElement('div');
    dot.className = 'tkfm-owner-chip-dot';

    const text = document.createElement('span');
    text.textContent = on ? 'Owner mode: ON' : 'Owner mode: off';

    const link = document.createElement('a');
    link.className = 'tkfm-owner-chip-link';
    link.textContent = 'Owner login';
    link.addEventListener('click', function () {
      window.location.href = 'owner-login.html';
    });

    chip.appendChild(dot);
    chip.appendChild(text);
    chip.appendChild(link);

    document.body.appendChild(chip);
  }

  function init() {
    if (!isInternalPage()) return;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderChip);
    } else {
      renderChip();
    }

    // If owner flag changes in another tab, update (best-effort)
    window.addEventListener('storage', function (e) {
      if (e.key === OWNER_KEY) {
        renderChip();
      }
    });
  }

  init();
})();
