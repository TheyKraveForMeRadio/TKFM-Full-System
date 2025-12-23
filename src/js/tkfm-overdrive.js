export function elevateWaveform(audioEl, logoEl) {
  if (!audioEl || !logoEl) return () => {}

  // Prevent double-mount on same audio element
  if (audioEl.__tkfmElevateCleanup) {
    try { audioEl.__tkfmElevateCleanup() } catch {}
  }

  // Reuse a single AudioContext app-wide
  const audioCtx =
    window.__TKFM_AUDIO_CTX ||
    (window.__TKFM_AUDIO_CTX = new (window.AudioContext || window.webkitAudioContext)())

  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 256

  // Create MediaElementSource only once per audio element
  let source = audioEl.__tkfmMediaSource
  if (!source) {
    try {
      source = audioCtx.createMediaElementSource(audioEl)
      audioEl.__tkfmMediaSource = source
    } catch {
      // If already connected elsewhere, fail gracefully
      return () => {}
    }
  }

  // Connect graph best-effort (avoid crashes if already connected)
  try { source.connect(analyser) } catch {}
  try { analyser.connect(audioCtx.destination) } catch {}

  const data = new Uint8Array(analyser.frequencyBinCount)

  let rafId = null
  let running = false

  function applyGlow(glow) {
    // Keep your neon vibe
    logoEl.style.filter =
      `drop-shadow(0 0 ${glow}px #ff00ff) ` +
      `drop-shadow(0 0 ${Math.round(glow * 0.7)}px #00ffff)`
  }

  function animate() {
    if (!running) return
    analyser.getByteFrequencyData(data)

    // Bass focus (first 20 bins)
    let sum = 0
    const n = Math.min(20, data.length)
    for (let i = 0; i < n; i++) sum += data[i]
    const bass = n ? (sum / n) : 0

    const glow = Math.min(80, Math.max(0, bass))
    applyGlow(glow)

    rafId = requestAnimationFrame(animate)
  }

  async function start() {
    if (running) return
    running = true
    try {
      if (audioCtx.state === 'suspended') await audioCtx.resume()
    } catch {}
    animate()
  }

  function stop() {
    running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
  }

  const onPlay = () => { start() }
  const onPause = () => { stop(); applyGlow(0) }
  const onEnded = () => { stop(); applyGlow(0) }

  audioEl.addEventListener('play', onPlay)
  audioEl.addEventListener('pause', onPause)
  audioEl.addEventListener('ended', onEnded)

  const cleanup = () => {
    stop()
    applyGlow(0)
    audioEl.removeEventListener('play', onPlay)
    audioEl.removeEventListener('pause', onPause)
    audioEl.removeEventListener('ended', onEnded)
    try { analyser.disconnect() } catch {}
  }

  audioEl.__tkfmElevateCleanup = cleanup
  return cleanup
}
