/**
 * TKFM UI Guard
 * Safe default dark theme so missing CSS/JS never makes the site look "white".
 */
(function () {
  try {
    const root = document.documentElement;
    const body = document.body;

    const bg = window.getComputedStyle(body).backgroundColor;
    const looksBlank =
      !bg ||
      bg === "rgba(0, 0, 0, 0)" ||
      bg === "transparent" ||
      bg === "rgb(255, 255, 255)";

    if (looksBlank) {
      body.style.background = "#020617";
      body.style.color = "rgb(226,232,240)";
      root.style.backgroundColor = "#020617";
      root.style.colorScheme = "dark";
    }

    if (window.getComputedStyle(body).display === "none") body.style.display = "block";

    root.setAttribute("data-tkfm-ui", "loaded");
    console.log("✔ tkfm-ui.js loaded");
  } catch (e) {
    console.warn("tkfm-ui.js warning:", e);
  }
})();
