/* TKFM FX: mouse-trail particles + spotlight + orbit glow
   theme: "radio" (neon) | "label" (gold)
*/
(function () {
  const prefersReduced = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const THEMES = {
    radio: {
      bg: "#020617",
      spotlight: "rgba(56,189,248,0.22)",
      orbitOpacity: 0.42,
      particleA: [255, 0, 128],
      particleB: [56, 189, 248],
      particleC: [34, 211, 238],
      gravity: 0.010,
      spawn: 3,
      radius: 14,
      blur: 0
    },
    label: {
      bg: "#020617",
      spotlight: "rgba(250,204,21,0.20)",
      orbitOpacity: 0.30,
      particleA: [250, 204, 21],
      particleB: [234, 179, 8],
      particleC: [249, 115, 22],
      gravity: 0.006,
      spawn: 2,
      radius: 11,
      blur: 0
    }
  };

  function ensureStyles() {
    if (document.getElementById("tkfm-fx-style")) return;
    const css = `
      body.tkfm-fx-on{ background:${THEMES.radio.bg}; }
      body.tkfm-fx-on > :not(.tkfm-fx-layer){ position:relative; z-index:1; }
      .tkfm-fx-layer{ position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
      .tkfm-fx-bg-main{
        position:absolute; inset:-25%;
        background:
          radial-gradient(circle at 0 0, rgba(255, 0, 128, 0.50), transparent 60%),
          radial-gradient(circle at 100% 100%, rgba(56, 189, 248, 0.45), transparent 60%);
        filter: blur(10px);
        opacity: 0.92;
        animation: tkfmFxGlow 28s linear infinite alternate;
        mix-blend-mode: screen;
      }
      .tkfm-fx-bg-orbit{
        position:absolute; inset:-40%;
        background:
          conic-gradient(from 200deg,
            rgba(255, 0, 128, 0.28),
            rgba(56, 189, 248, 0.28),
            rgba(250, 204, 21, 0.16),
            rgba(255, 0, 128, 0.28)
          );
        filter: blur(45px);
        opacity: 0.42;
        animation: tkfmFxOrbit 42s linear infinite;
        mix-blend-mode: screen;
      }
      .tkfm-fx-spotlight{
        position:absolute; inset:0;
        background: radial-gradient(650px 420px at var(--tkfm-x,50%) var(--tkfm-y,40%), rgba(56,189,248,0.22), transparent 65%);
        opacity: 0.9;
        transition: opacity .18s ease-out;
        mix-blend-mode: screen;
      }
      canvas.tkfm-fx-canvas{ position:absolute; inset:0; width:100%; height:100%; }

      .tkfm-fx-label .tkfm-fx-bg-main{
        background:
          radial-gradient(circle at 0 0, rgba(250, 204, 21, 0.34), transparent 62%),
          radial-gradient(circle at 100% 100%, rgba(249, 115, 22, 0.26), transparent 62%),
          radial-gradient(circle at 60% 30%, rgba(234, 179, 8, 0.22), transparent 58%);
        opacity: 0.85;
      }
      .tkfm-fx-label .tkfm-fx-bg-orbit{
        background:
          conic-gradient(from 220deg,
            rgba(250, 204, 21, 0.22),
            rgba(234, 179, 8, 0.20),
            rgba(249, 115, 22, 0.16),
            rgba(250, 204, 21, 0.22)
          );
        opacity: 0.30;
      }
      .tkfm-fx-label .tkfm-fx-spotlight{
        background: radial-gradient(700px 460px at var(--tkfm-x,50%) var(--tkfm-y,40%), rgba(250,204,21,0.20), transparent 66%);
        opacity: 0.85;
      }

      @keyframes tkfmFxGlow{
        0%{ transform: translate3d(0,0,0) scale(1); }
        50%{ transform: translate3d(2%,-3%,0) scale(1.02); }
        100%{ transform: translate3d(-3%,3%,0) scale(1.03); }
      }
      @keyframes tkfmFxOrbit{
        0%{ transform: rotate(0deg) scale(1.06); }
        100%{ transform: rotate(360deg) scale(1.06); }
      }
    `;
    const style = document.createElement("style");
    style.id = "tkfm-fx-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function mount(opts) {
    if (prefersReduced()) return;

    opts = opts || {};
    const themeName = (opts.theme || document.body.getAttribute("data-tkfm-theme") || "radio").toLowerCase();
    const theme = THEMES[themeName] || THEMES.radio;

    if (document.body.dataset.tkfmFxMounted === "1") return;
    document.body.dataset.tkfmFxMounted = "1";

    ensureStyles();
    document.body.classList.add("tkfm-fx-on");

    const layer = document.createElement("div");
    layer.className = "tkfm-fx-layer" + (themeName === "label" ? " tkfm-fx-label" : "");
    layer.setAttribute("aria-hidden", "true");

    const bgMain = document.createElement("div");
    bgMain.className = "tkfm-fx-bg-main";

    const bgOrbit = document.createElement("div");
    bgOrbit.className = "tkfm-fx-bg-orbit";
    bgOrbit.style.opacity = String(theme.orbitOpacity);

    const spotlight = document.createElement("div");
    spotlight.className = "tkfm-fx-spotlight";

    const canvas = document.createElement("canvas");
    canvas.className = "tkfm-fx-canvas";
    canvas.id = "tkfm-particles";

    layer.appendChild(bgOrbit);
    layer.appendChild(bgMain);
    layer.appendChild(spotlight);
    layer.appendChild(canvas);

    document.body.insertBefore(layer, document.body.firstChild);

    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles = [];
    let lastX = width * 0.5;
    let lastY = height * 0.4;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);

    function spawnParticle(x, y) {
      const v = 0.9;
      particles.push({
        x, y,
        vx: (Math.random() - 0.5) * v,
        vy: (Math.random() - 0.5) * v - 0.2,
        life: 1,
        r: theme.radius * (0.7 + Math.random() * 0.6),
        type: Math.random()
      });
    }

    function onMove(e) {
      const x = e.clientX;
      const y = e.clientY;
      lastX = x; lastY = y;

      const px = (x / Math.max(1, width)) * 100;
      const py = (y / Math.max(1, height)) * 100;
      document.documentElement.style.setProperty("--tkfm-x", px.toFixed(2) + "%");
      document.documentElement.style.setProperty("--tkfm-y", py.toFixed(2) + "%");

      const amount = theme.spawn;
      for (let i = 0; i < amount; i++) spawnParticle(x, y);
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });

    function colorFor(p) {
      const a = theme.particleA, b = theme.particleB, c = theme.particleC;
      if (p.type < 0.34) return a;
      if (p.type < 0.67) return b;
      return c;
    }

    function render() {
      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += theme.gravity;
        p.life -= 0.02;

        if (p.life <= 0) { particles.splice(i, 1); continue; }

        const alpha = p.life;
        const rgb = colorFor(p);
        const r = p.r;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`);
        grad.addColorStop(0.55, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha * 0.65})`);
        grad.addColorStop(1, `rgba(0,0,0,0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    // start spotlight vars
    document.documentElement.style.setProperty("--tkfm-x", (lastX / width * 100).toFixed(2) + "%");
    document.documentElement.style.setProperty("--tkfm-y", (lastY / height * 100).toFixed(2) + "%");
  }

  window.TKFM_FX = { mount };
})();
