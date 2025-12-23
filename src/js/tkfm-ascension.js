export function ascensionRing(audioEl, containerEl) {
  if (!audioEl || !containerEl) return () => {}

  // Prevent double-mount on same audio element
  if (audioEl.__tkfmAscensionRingCleanup) {
    try { audioEl.__tkfmAscensionRingCleanup() } catch {}
  }

  // Canvas
  const canvas = document.createElement('canvas')
  canvas.width = 320
  canvas.height = 320
  canvas.style.position = 'absolute'
  canvas.style.top = '50%'
  canvas.style.left = '50%'
  canvas.style.transform = 'translate(-50%, -50%)'
  canvas.style.pointerEvents = 'none'
  canvas.style.zIndex = '1'

  // Ensure container positioning
  const prevPos = containerEl.style.position
  if (!prevPos || prevPos === '') containerEl.style.position = 'relative'
  containerEl.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    // Cleanup if canvas context not available
    canvas.remove()
    return () => {}
  }

  // Reuse a single AudioContext across the app (enterprise best practice)
  const audioCtx =
    window.__TKFM_AUDIO_CTX ||
    (window.__TKFM_AUDIO_CTX = new (window.AudioContext || window.webkitAudioContext)())

  const analyser = audioCtx.createAnalyser()
  analyser.fftSize = 512

  // MediaElementSource: must be created only once per audio element
  let source = audioEl.__tkfmMediaSource
  if (!source) {
    try {
      source = audioCtx.createMediaElementSource(audioEl)
      audioEl.__tkfmMediaSource = source
    } catch {
      // If browser rejects (e.g., already connected elsewhere), fail gracefully
      canvas.remove()
      return () => {}
    }
  }

  // Connect graph (avoid duplicate connections)
  // Keep it simple: connect source -> analyser -> destination
  try {
    source.connect(analyser)
  } catch {}
  try {
    analyser.connect(audioCtx.destination)
  } catch {}

  const data = new Uint8Array(analyser.frequencyBinCount)

  let rafId = null
  let running = false

  function draw() {
    if (!running) return
    analyser.getByteFrequencyData(data)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const baseRadius = 110
    const bars = 120

    for (let i = 0; i < bars; i++) {
      const amp = data[i] / 255
      const angle = (i / bars) * Math.PI * 2

      const inner = baseRadius
      const outer = baseRadius + amp * 70

      const x1 = cx + inner * Math.cos(angle)
      const y1 = cy + inner * Math.sin(angle)
      const x2 = cx + outer * Math.cos(angle)
      const y2 = cy + outer * Math.sin(angle)

      // Keep your neon vibe
      ctx.strokeStyle = `hsla(${280 + i}, 100%, 60%, 0.85)`
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    rafId = requestAnimationFrame(draw)
  }

  async function start() {
    if (running) return
    running = true

    // Autoplay policy safe: resume on user gesture/play event
    try {
      if (audioCtx.state === 'suspended') await audioCtx.resume()
    } catch {}

    draw()
  }

  function stop() {
    running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
  }

  const onPlay = () => { start() }
  const onPause = () => { stop() }
  const onEnded = () => { stop() }

  audioEl.addEventListener('play', onPlay)
  audioEl.addEventListener('pause', onPause)
  audioEl.addEventListener('ended', onEnded)

  // Provide cleanup for SPA / re-render safety
  const cleanup = () => {
    stop()
    audioEl.removeEventListener('play', onPlay)
    audioEl.removeEventListener('pause', onPause)
    audioEl.removeEventListener('ended', onEnded)

    try { canvas.remove() } catch {}

    // IMPORTANT: do not close shared AudioContext (would break other audio)
    // Disconnect nodes best-effort
    try { analyser.disconnect() } catch {}
    // Do not disconnect source globally if reused elsewhere
  }

  audioEl.__tkfmAscensionRingCleanup = cleanup
  return cleanup
}
