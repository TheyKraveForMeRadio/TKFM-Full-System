/**
 * TKFM Shell — injects radio/label header + mobile menu + FX
 * Theme selection:
 *   <meta name="tkfm-theme" content="radio"> OR content="label"
 *
 * Owner gating is separate via /js/access-gates.js + meta tkfm-access
 */
(function () {
  function q(sel){ return document.querySelector(sel); }
  function qa(sel){ return Array.from(document.querySelectorAll(sel)); }

  const themeMeta = q('meta[name="tkfm-theme"]');
  const theme = (themeMeta ? themeMeta.getAttribute("content") : "radio") || "radio";
  const t = theme.toLowerCase().includes("label") ? "label" : "radio";

  document.body.classList.add("tkfm-theme-" + t);

  // Background layers (only once)
  if (!q(".tkfm-bg")) {
    const bg = document.createElement("div");
    bg.className = "tkfm-bg";
    document.body.prepend(bg);
  }
  if (!q(".tkfm-floaters")) {
    const fl = document.createElement("div");
    fl.className = "tkfm-floaters";
    fl.innerHTML =
      '<div class="tkfm-float" style="left:-140px;top:220px;--x:0px;--y:0px"></div>' +
      '<div class="tkfm-float f2" style="right:-180px;top:80px;--x:0px;--y:0px"></div>' +
      '<div class="tkfm-float f3" style="left:30%;bottom:-240px;--x:0px;--y:0px"></div>';
    document.body.prepend(fl);
  }

  // Inject header (only if not present)
  if (!document.getElementById("tkfmHeader")) {
    const header = document.createElement("header");
    header.id = "tkfmHeader";
    header.className = "tkfm-topbar";
    const isRadio = (t === "radio");

    const logoSrc = isRadio ? "/tkfm-radio-logo.png" : "/tkfm-records-logo.png";
    const kicker = isRadio ? "They Krave For Me Radio" : "TKFM Records";
    const title  = isRadio ? "Live • DJs • Rotation" : "Label Ops • Contracts • Catalog";

    const nav = isRadio
      ? [
          ["index.html","Home"],
          ["radio-hub.html","Radio Hub"],
          ["now-playing.html","Now Playing"],
          ["dj-schedule.html","Schedule"],
          ["artists.html","Artists"],
          ["pricing.html","Pricing"],
          ["label-home.html","Records"]
        ]
      : [
          ["label-home.html","Label Home"],
          ["label-hub.html","Label Hub"],
          ["label-submissions.html","Submissions"],
          ["label-contract-lab.html","Contract Lab"],
          ["mixtape-label-console.html","Catalog"],
          ["pricing.html","Pricing"],
          ["radio-hub.html","Radio"]
        ];

    const navHtml = nav.map(([href,txt]) => `<a class="tkfm-pill" href="${href}">${txt}</a>`).join("");

    header.innerHTML = `
      <div class="tkfm-wrap" style="padding:12px 24px">
        <a class="tkfm-brand" href="${isRadio ? "index.html" : "label-home.html"}">
          <div class="tkfm-logoWrap" aria-hidden="true">
            <div class="tkfm-logoGlow"></div>
            <div class="tkfm-eq">
              <div class="tkfm-eqBars">
                <span></span><span></span><span></span><span></span><span></span>
              </div>
            </div>
            <img src="${logoSrc}" alt="${isRadio ? "TKFM Radio" : "TKFM Records"}" />
          </div>
          <div>
            <div class="tkfm-kicker">${kicker}</div>
            <div class="tkfm-title">${title}</div>
          </div>
        </a>

        <nav class="tkfm-nav">
          ${navHtml}
        </nav>

        <button class="tkfm-menuBtn" id="tkfmMenuBtn" aria-label="Menu">≡</button>
      </div>

      <div class="tkfm-drawer" id="tkfmDrawer">
        ${nav.map(([href,txt]) => `<a href="${href}"><span>${txt}</span><span>→</span></a>`).join("")}
      </div>
    `;

    document.body.prepend(header);
  }

  // Footer (only once)
  if (!document.getElementById("tkfmFooter")) {
    const footer = document.createElement("footer");
    footer.id = "tkfmFooter";
    footer.className = "tkfm-footer";
    footer.innerHTML = `
      <div class="tkfm-wrap" style="padding:18px 24px">
        <div>© 2025 TKFM — ${t === "radio" ? "They Krave For Me Radio" : "TKFM Records"}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="tkfm-pill" href="contact.html">Contact</a>
          <a class="tkfm-pill" href="media-kit.html">Media Kit</a>
          <a class="tkfm-pill" href="owner-login.html">Owner Login</a>
        </div>
      </div>
    `;
    document.body.appendChild(footer);
  }

  // Mobile menu toggle
  function closeDrawer(){ const d = document.getElementById("tkfmDrawer"); if (d) d.style.display = "none"; }
  function toggleDrawer(){
    const d = document.getElementById("tkfmDrawer");
    if (!d) return;
    d.style.display = (d.style.display === "block") ? "none" : "block";
  }

  const btn = document.getElementById("tkfmMenuBtn");
  if (btn && !btn.__tkfmBound) {
    btn.__tkfmBound = true;
    btn.addEventListener("click", toggleDrawer);
    document.addEventListener("click", function (e) {
      const d = document.getElementById("tkfmDrawer");
      if (!d) return;
      if (e.target === btn || d.contains(e.target)) return;
      closeDrawer();
    });
    window.addEventListener("resize", function(){ if (window.innerWidth > 860) closeDrawer(); });
  }

  // Reactive floaters (mouse parallax)
  const floaters = qa(".tkfm-floaters .tkfm-float");
  let raf = 0;
  function onMove(ev){
    const x = (ev.clientX / window.innerWidth) - 0.5;
    const y = (ev.clientY / window.innerHeight) - 0.5;
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function(){
      floaters.forEach((el, i) => {
        const mx = (x * (18 + i*6));
        const my = (y * (16 + i*6));
        el.style.setProperty("--x", mx.toFixed(1) + "px");
        el.style.setProperty("--y", my.toFixed(1) + "px");
      });
    });
  }
  window.addEventListener("pointermove", onMove, {passive:true});
})();
