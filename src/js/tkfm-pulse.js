// TKFM Pulse Engine — Hardened Module (LOCKED)

export function activatePulse(audioEl, logoEl) {
  if (!audioEl || !logoEl) return;

  audioEl.addEventListener('play', () => {
    logoEl.classList.add('pulse-active');
  });

  audioEl.addEventListener('pause', () => {
    logoEl.classList.remove('pulse-active');
  });

  audioEl.addEventListener('ended', () => {
    logoEl.classList.remove('pulse-active');
  });
}
