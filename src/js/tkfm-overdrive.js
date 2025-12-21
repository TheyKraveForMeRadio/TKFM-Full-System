export function elevateWaveform(audioEl, logoEl) {
  if (!audioEl || !logoEl) return;

  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;

  const source = ctx.createMediaElementSource(audioEl);
  source.connect(analyser);
  analyser.connect(ctx.destination);

  const data = new Uint8Array(analyser.frequencyBinCount);

  function animate() {
    analyser.getByteFrequencyData(data);

    // Focus on bass
    const bass = data.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
    const glow = Math.min(80, bass);

    logoEl.style.filter = `
      drop-shadow(0 0 ${glow}px #ff00ff)
      drop-shadow(0 0 ${glow * 0.7}px #00ffff)
    `;

    requestAnimationFrame(animate);
  }

  audioEl.addEventListener('play', () => {
    ctx.resume();
    animate();
  });
}
