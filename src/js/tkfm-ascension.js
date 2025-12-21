export function ascensionRing(audioEl, containerEl) {
  if (!audioEl || !containerEl) return;

  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 320;
  canvas.style.position = 'absolute';
  canvas.style.top = '50%';
  canvas.style.left = '50%';
  canvas.style.transform = 'translate(-50%, -50%)';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '1';

  containerEl.style.position = 'relative';
  containerEl.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 512;

  const source = audioCtx.createMediaElementSource(audioEl);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  const data = new Uint8Array(analyser.frequencyBinCount);

  function draw() {
    analyser.getByteFrequencyData(data);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const baseRadius = 110;
    const bars = 120;

    for (let i = 0; i < bars; i++) {
      const amp = data[i] / 255;
      const angle = (i / bars) * Math.PI * 2;

      const inner = baseRadius;
      const outer = baseRadius + amp * 70;

      const x1 = cx + inner * Math.cos(angle);
      const y1 = cy + inner * Math.sin(angle);
      const x2 = cx + outer * Math.cos(angle);
      const y2 = cy + outer * Math.sin(angle);

      ctx.strokeStyle = `hsla(${280 + i}, 100%, 60%, 0.85)`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  audioEl.addEventListener('play', () => {
    audioCtx.resume();
    draw();
  });
}
