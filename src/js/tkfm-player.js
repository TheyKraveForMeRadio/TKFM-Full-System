// TKFM NEON PLAYER — Pulse + Overdrive Auto Link

window.TKFMPlayer = {
  init() {
    const audio = document.querySelector('audio')
    if (!audio) return

    audio.addEventListener('play', () => {
      if (window.startPulse) startPulse()
      if (window.activateOverdrive) activateOverdrive(audio)
      document.body.classList.add('tkfm-playing')
    })

    audio.addEventListener('pause', () => {
      document.body.classList.remove('tkfm-playing')
    })
  }
}

document.addEventListener('DOMContentLoaded', () => {
  TKFMPlayer.init()
})
