/* TKFM Quick Checkout (sitewide)
   - Works with:
     .js-checkout buttons AND any element with data-plan / data-feature (plus common variants)
   - Sends { planId, email } to /.netlify/functions/create-checkout-session
   - Redirects to Stripe Checkout URL on success
*/
(function () {
  const ENDPOINT = "/.netlify/functions/create-checkout-session";

  function closestCheckoutEl(target) {
    if (!target) return null;
    return target.closest(
      ".js-checkout,[data-plan],[data-feature],[data-plan-id],[data-feature-id],[data-planid],[data-featureid],[data-planId],[data-featureId]"
    );
  }

  function getAttrAny(el, names) {
    for (const n of names) {
      const v = el.getAttribute && el.getAttribute(n);
      if (v && String(v).trim()) return String(v).trim();
    }
    return "";
  }

  function getPlanIdFromEl(el) {
    if (!el) return "";
    // dataset first (covers data-plan / data-feature)
    const ds = el.dataset || {};
    const direct =
      (ds.plan && String(ds.plan).trim()) ||
      (ds.feature && String(ds.feature).trim()) ||
      "";
    if (direct) return direct;

    // common attribute variants
    const v = getAttrAny(el, [
      "data-plan",
      "data-feature",
      "data-plan-id",
      "data-feature-id",
      "data-planid",
      "data-featureid",
      "data-planId",
      "data-featureId",
    ]);
    if (v) return v;

    // allow passing planId via href params on <a>
    const href = (el.getAttribute && el.getAttribute("href")) || "";
    if (href && href.includes("?")) {
      try {
        const u = new URL(href, window.location.origin);
        const qp =
          u.searchParams.get("planId") ||
          u.searchParams.get("plan") ||
          u.searchParams.get("feature") ||
          u.searchParams.get("id") ||
          u.searchParams.get("lookup_key") ||
          "";
        if (qp) return qp;
      } catch (e) {}
    }

    return "";
  }

  function getEmail() {
    // 1) look for a visible email input
    const input = document.querySelector('input[type="email"], input[name*="email" i], input[id*="email" i]');
    if (input && input.value && String(input.value).trim()) return String(input.value).trim();

    // 2) known localStorage keys
    const candidates = [
      "tkfm_user_email",
      "tkfm_email",
      "email",
      "TKFM_EMAIL",
    ];
    for (const k of candidates) {
      const v = localStorage.getItem(k);
      if (v && String(v).trim()) return String(v).trim();
    }

    // 3) tkfm_user object
    try {
      const u = JSON.parse(localStorage.getItem("tkfm_user") || "null");
      if (u && (u.email || u.userEmail)) return String(u.email || u.userEmail).trim();
    } catch (e) {}

    return "";
  }

  async function checkout(planId) {
    const payload = { planId };
    const email = getEmail();
    if (email) payload.email = email;

    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data = null;
    try { data = await res.json(); } catch (e) {}

    if (!res.ok || !data || data.ok !== true || !data.url) {
      const msg = (data && (data.error || data.message)) || `Checkout failed (${res.status})`;
      throw new Error(msg);
    }

    window.location.href = data.url;
  }

  function showMissingPlan(el) {
    const snippet = (el && el.outerHTML) ? el.outerHTML.slice(0, 300) : "(unknown element)";
    alert("TKFM CHECKOUT ERROR: Missing planId on clicked element.\n\nFix: add data-plan=\"...\" or data-feature=\"...\".\n\nElement:\n" + snippet);
  }

  document.addEventListener("click", function (e) {
    const el = closestCheckoutEl(e.target);
    if (!el) return;

    // If it’s a link with href to another page (no plan), let it work
    const pid = getPlanIdFromEl(el);
    if (!pid) {
      e.preventDefault();
      showMissingPlan(el);
      return;
    }

    // prevent navigation / form submit; we handle redirect
    e.preventDefault();
    e.stopPropagation();

    checkout(pid).catch((err) => {
      alert("TKFM CHECKOUT ERROR:\n" + (err && err.message ? err.message : String(err)));
    });
  }, true);
})();
