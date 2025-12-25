import "./styles.css";
import "./main.js";
import { header, footer } from "./_partials.js";

export function mountShell(active="") {
  const top = document.getElementById("tkfm-header");
  const bottom = document.getElementById("tkfm-footer");
  if (top) top.innerHTML = header(active);
  if (bottom) bottom.innerHTML = footer();
}
