/* TKFM Quick Checkout
   - Handles clicks on buttons/links that include data-plan or data-feature.
   - Works even when markup doesn't have .js-checkout class (delegated handler).
   - Writes tkfm_last_planId before redirect so post-checkout routing can work.
*/
(() => {
  const ENDPOINT = "/.netlify/functions/create-checkout-session";

  function getEmail() {
    const saved =
      localStorage.getItem("tkfm_email") ||
      localStorage.getItem("ownerEmail") ||
      localStorage.getItem("tkfm_owner_email") ||
      "";
    return (saved || "").trim();
  }

  function setLastPlan(planId) {
    try {
      localStorage.setItem("tkfm_last_planId", String(planId || ""));
      localStorage.setItem("tkfm_last_checkout_at", String(Date.now()));
    } catch {}
  }

  async function startCheckout(planId, featureId, emailOverride) {
    const email = (emailOverride || getEmail() || "").trim();
    setLastPlan(planId || featureId || "");

    const payload = {
      planId: planId || null,
      featureId: featureId || null,
      email: email || null
    };

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    let data = {};
    try { data = await res.json(); } catch {}

    if (!data || data.ok !== true || !data.url) {
      const msg = (data && (data.error || data.message)) ? (data.error || data.message) : "Checkout failed.";
      alert(msg);
      throw new Error(msg);
    }

    window.location.href = data.url;
  }

  function findPlanTarget(el) {
    if (!el) return null;

    // click may be on inner span; walk up to 4 levels
    let cur = el;
    for (let i = 0; i < 6 && cur; i++) {
      if (cur.getAttribute) {
        const plan = cur.getAttribute("data-plan") || cur.getAttribute("data-planid") || "";
        const feat = cur.getAttribute("data-feature") || cur.getAttribute("data-featureid") || "";
        if (plan || feat) return { planId: plan || null, featureId: feat || null, node: cur };
      }
      cur = cur.parentElement;
    }
    return null;
  }

  // Delegated handler covers ALL pages (even if markup has no js-checkout class)
  document.addEventListener("click", (e) => {
    const t = findPlanTarget(e.target);
    if (!t) return;

    // prevent normal navigation for <a>
    e.preventDefault();

    // Disable double-click spam
    try {
      t.node.disabled = true;
      t.node.setAttribute("data-busy", "1");
      t.node.style.opacity = "0.75";
      t.node.style.pointerEvents = "none";
    } catch {}

    startCheckout(t.planId, t.featureId).catch(() => {
      try {
        t.node.disabled = false;
        t.node.removeAttribute("data-busy");
        t.node.style.opacity = "";
        t.node.style.pointerEvents = "";
      } catch {}
    });
  }, { passive: false });

  // Optional: expose a global for advanced pages
  window.TKFMCheckout = { startCheckout };
})();