/**
 * TKFM UI Guard (root copy)
 * Keep in sync with /js/tkfm-ui.js
 */
(function () {
  try {
    const root = document.documentElement;
    const body = document.body;
    const computedBg = window.getComputedStyle(body).backgroundColor;
    const isDefaultBg =
      !computedBg ||
      computedBg === "rgba(0, 0, 0, 0)" ||
      computedBg === "transparent" ||
      computedBg === "rgb(255, 255, 255)";

    if (isDefaultBg) {
      body.style.background = "#020617";
      body.style.color = "rgb(226,232,240)";
      root.style.backgroundColor = "#020617";
      root.style.colorScheme = "dark";
    }

    const computedDisplay = window.getComputedStyle(body).display;
    if (computedDisplay === "none") body.style.display = "block";

    root.setAttribute("data-tkfm-ui", "loaded");
    console.log("✔ tkfm-ui.js loaded (root)");
  } catch (e) {
    console.warn("tkfm-ui.js loaded with warning:", e);
  }
})();
