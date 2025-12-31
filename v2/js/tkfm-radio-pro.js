/* TKFM RADIO PRO UI
   - Mobile menu toggle
   - Animated EQ bars (behind logo)
   - Reactive floaters (parallax)
   - Stream player with localStorage url (tkfm_radioStreamUrl)
   - Now playing reads localStorage (tkfm_nowPlaying)
*/

(function () {
  function $(s){ return document.querySelector(s); }
  function $all(s){ return Array.from(document.querySelectorAll(s)); }

  // Ensure background layers exist
  if (!$(".tkfm-bg")) {
    const bg = document.createElement("div");
    bg.className = "tkfm-bg";
    document.body.prepend(bg);
  }
  if (!$(".tkfm-floaters")) {
    const fl = document.createElement("div");
    fl.className = "tkfm-floaters";
    fl.innerHTML =
      '<div class="tkfm-float" style="left:-140px;top:220px;--x:0px;--y:0px"></div>' +
      '<div class="tkfm-float f2" style="right:-180px;top:80px;--x:0px;--y:0px"></div>' +
      '<div class="tkfm-float f3" style="left:30%;bottom:-240px;--x:0px;--y:0px"></div>';
    document.body.prepend(fl);
  }

  // Mobile menu
  const btn = $("#tkfmMenuBtn");
  const drawer = $("#tkfmDrawer");
  function closeDrawer(){ if (drawer) drawer.style.display = "none"; }
  function toggleDrawer(){
    if (!drawer) return;
    drawer.style.display = (drawer.style.display === "block") ? "none" : "block";
  }
  if (btn && drawer && !btn.__bound) {
    btn.__bound = true;
    btn.addEventListener("click", toggleDrawer);
    document.addEventListener("click", function (e) {
      if (e.target === btn) return;
      if (drawer.contains(e.target)) return;
      closeDrawer();
    });
    window.addEventListener("resize", function(){ if (window.innerWidth > 860) closeDrawer(); });
  }

  // EQ bars animation
  const bars = $all(".tkfm-eqBars span");
  let eqTimer = 0;
  function tickEQ(){
    if (!bars.length) return;
    const t = Date.now();
    if (t - eqTimer > 85) {
      eqTimer = t;
      for (let i=0;i<bars.length;i++){
        const h = 18 + Math.floor(Math.random() * 80);
        bars[i].style.height = h + "%";
        bars[i].style.opacity = (0.75 + Math.random() * 0.25).toFixed(2);
      }
    }
    requestAnimationFrame(tickEQ);
  }
  tickEQ();

  // Floaters parallax
  const floaters = $all(".tkfm-floaters .tkfm-float");
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

  // Player
  function getStreamUrl(){ return (localStorage.getItem("tkfm_radioStreamUrl") || "").trim(); }
  function setStreamUrl(u){ localStorage.setItem("tkfm_radioStreamUrl", (u||"").trim()); }
  function clearStreamUrl(){ localStorage.removeItem("tkfm_radioStreamUrl"); }

  const audio = $("#tkfmAudio");
  const btnPlay = $("#tkfmPlay");
  const vol = $("#tkfmVol");
  const srcText = $("#tkfmStreamSrc");
  const curUrl = $("#tkfmCurUrl");

  function syncUrl(){
    const u = getStreamUrl();
    if (srcText) srcText.textContent = u || "Not set";
    if (curUrl) curUrl.textContent = u || "Not set";
    if (audio && u && audio.src !== u) audio.src = u;
  }

  function togglePlay(){
    if (!audio || !btnPlay) return;
    if (!audio.src){
      alert("Set the stream URL first.");
      return;
    }
    if (audio.paused) {
      audio.play().catch(function(){ alert("Unable to start stream. Check the URL."); });
    } else {
      audio.pause();
    }
    btnPlay.textContent = audio.paused ? "▶" : "❚❚";
  }

  if (btnPlay && audio && !btnPlay.__bound) {
    btnPlay.__bound = true;
    btnPlay.addEventListener("click", togglePlay);
    audio.addEventListener("play", () => btnPlay.textContent = "❚❚");
    audio.addEventListener("pause", () => btnPlay.textContent = "▶");
  }

  if (vol && audio && !vol.__bound) {
    vol.__bound = true;
    audio.volume = Number(vol.value || 0.85);
    vol.addEventListener("input", function(){ audio.volume = Number(vol.value || 0.85); });
  }

  const setBtn = $("#tkfmSetUrl");
  const clrBtn = $("#tkfmClearUrl");
  if (setBtn && !setBtn.__bound) {
    setBtn.__bound = true;
    setBtn.addEventListener("click", function(){
      const u = prompt("Paste your radio stream URL (example: https://.../stream.mp3)");
      if (u === null) return;
      const v = (u||"").trim();
      if (!v) { alert("Stream URL cannot be empty."); return; }
      setStreamUrl(v);
      syncUrl();
      alert("Saved. Press Play.");
    });
  }
  if (clrBtn && !clrBtn.__bound) {
    clrBtn.__bound = true;
    clrBtn.addEventListener("click", function(){
      clearStreamUrl();
      if (audio) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
      syncUrl();
      if (btnPlay) btnPlay.textContent = "▶";
    });
  }

  // Now Playing
  const nowTitle = $("#tkfmNowTitle");
  function refreshNow(){
    if (!nowTitle) return;
    try{
      const np = JSON.parse(localStorage.getItem("tkfm_nowPlaying") || "null");
      if (np && (np.title || np.artist)) {
        const t = (np.artist ? (np.artist + " — ") : "") + (np.title || "Now Playing");
        nowTitle.textContent = t;
      }
    }catch(e){}
  }

  syncUrl();
  refreshNow();
  setInterval(refreshNow, 2500);
})();
