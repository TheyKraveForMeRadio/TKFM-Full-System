// TKFM Pulse Engine — ENTERPRISE LOCKED

export function activatePulse(audioEl, logoEl) {
  if (!audioEl || !logoEl) return () => {}

  // Prevent double-mount on same audio element
  if (audioEl.__tkfmPulseCleanup) {
    try { audioEl.__tkfmPulseCleanup() } catch {}
  }

  const add = () => logoEl.classList.add('pulse-active')
  const remove = () => logoEl.classList.remove('pulse-active')

  const onPlay = () => add()
  const onPause = () => remove()
  const onEnded = () => remove()

  audioEl.addEventListener('play', onPlay)
  audioEl.addEventListener('pause', onPause)
  audioEl.addEventListener('ended', onEnded)

  // Sync initial state
  try {
    if (!audioEl.paused && !audioEl.ended) add()
    else remove()
  } catch {
    // ignore
  }

  const cleanup = () => {
    audioEl.removeEventListener('play', onPlay)
    audioEl.removeEventListener('pause', onPause)
    audioEl.removeEventListener('ended', onEnded)
    remove()
  }

  audioEl.__tkfmPulseCleanup = cleanup
  return cleanup
}
