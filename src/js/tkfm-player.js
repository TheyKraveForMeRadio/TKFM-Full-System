// TKFM NEON PLAYER — ENTERPRISE LOCKED (Pulse + Overdrive Auto Link)

window.TKFMPlayer = {
  _boundAudio: null,
  _cleanup: null,

  init() {
    // If already initialized, clean up and rebind
    if (this._cleanup) {
      try { this._cleanup() } catch {}
      this._cleanup = null
      this._boundAudio = null
    }

    // Prefer a specifically marked player audio if you have it
    // e.g. <audio id="tkfm-player-audio"> or <audio data-tkfm-player>
    const audio =
      document.querySelector('audio[data-tkfm-player]') ||
      document.getElementById('tkfm-player-audio') ||
      document.querySelector('audio')

    if (!audio) return

    this._boundAudio = audio

    const onPlay = () => {
      try { if (typeof window.startPulse === 'function') window.startPulse() } catch {}
      try { if (typeof window.activateOverdrive === 'function') window.activateOverdrive(audio) } catch {}
      document.body.classList.add('tkfm-playing')
    }

    const onPause = () => {
      document.body.classList.remove('tkfm-playing')
    }

    const onEnded = () => {
      document.body.classList.remove('tkfm-playing')
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    // Cleanup function (enterprise-safe)
    this._cleanup = () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  },
}

document.addEventListener('DOMContentLoaded', () => {
  window.TKFMPlayer.init()
})

// Optional: if your DOM swaps audio elements dynamically, you can re-init safely:
// window.TKFMPlayer.init()
