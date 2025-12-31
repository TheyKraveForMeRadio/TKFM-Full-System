/* TKFM LABEL PRO UI
   - Mobile menu toggle
   - Subtle background layer
*/

(function () {
  function $(s){ return document.querySelector(s); }

  if (!$(".tkfm-labelBg")) {
    const bg = document.createElement("div");
    bg.className = "tkfm-labelBg";
    document.body.prepend(bg);
  }

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
})();
