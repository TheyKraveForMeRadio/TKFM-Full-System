(() => {
  // TKFM Post-Checkout Router
  // Goal: after Stripe success redirect, route buyers into the correct engine submission flow.
  // Works even if success_url doesn't carry planId, using localStorage set by tkfm-quick-checkout.js.

  function qs(name) {
    try { return new URLSearchParams(location.search).get(name) || ""; } catch { return ""; }
  }

  const sessionId = qs("session_id") || qs("session") || "";
  const qpPlan = qs("planId") || qs("plan") || qs("featureId") || qs("feature") || "";

  const lsPlan =
    localStorage.getItem("tkfm_last_planId") ||
    localStorage.getItem("tkfm_last_plan") ||
    localStorage.getItem("tkfm_last_checkout_plan") ||
    "";

  const planId = (qpPlan || lsPlan || "").trim();

  const $plan = document.getElementById("tkfmPlanId");
  const $sess = document.getElementById("tkfmSessionId");
  const $src  = document.getElementById("tkfmPlanSource");
  const $steps = document.getElementById("tkfmNextSteps");
  const $status = document.getElementById("tkfmStatus");

  function setStatus(kind, strong, msg) {
    if (!$status) return;
    const cls = kind === "ok" ? "ok" : kind === "err" ? "err" : "warn";
    $status.innerHTML = `<b class="${cls}">${strong}</b> <span>${msg}</span>`;
  }

  function btn(label, href, primary=false) {
    const a = document.createElement("a");
    a.className = "btn" + (primary ? " primary" : "");
    a.href = href;
    a.textContent = label;
    return a;
  }

  function clearLastPlanSoon() {
    // keep last plan for a bit (so refresh works), but clear after a short delay
    try {
      setTimeout(() => {
        localStorage.removeItem("tkfm_last_checkout_plan");
        // don't clear tkfm_last_planId permanently (it's useful as fallback), but we can timestamp it.
        localStorage.setItem("tkfm_last_checkout_seen_at", String(Date.now()));
      }, 2500);
    } catch {}
  }

  function routeFor(plan) {
    const p = (plan || "").toLowerCase();

    // Video lanes
    if (p.includes("video_") || p.includes("visual") || p.includes("reels") || p.includes("music_video")) {
      return [
        { label: "Submit your video", href: "/video-engine.html#submit", primary: true },
        { label: "View featured TV", href: "/radio-tv.html#featured", primary: false },
        { label: "Creator Pass dashboard", href: "/video.html", primary: false },
      ];
    }

    // Podcast lanes
    if (p.includes("podcast") || p.includes("interview")) {
      return [
        { label: "Submit your podcast", href: "/podcast-engine.html#submit", primary: true },
        { label: "Open Live Cast request", href: "/podcast.html#live", primary: false },
        { label: "View featured TV", href: "/radio-tv.html#featured", primary: false },
      ];
    }

    // Press / PR lanes
    if (p.includes("press") || p.includes("pr_") || p.includes("playlist_pitch") || p.includes("priority_submission")) {
      return [
        { label: "Submit your press / pack", href: "/press-engine.html#submit", primary: true },
        { label: "Artist submissions console", href: "/artist-submissions-console.html", primary: false },
      ];
    }

    // Sponsor lanes
    if (p.includes("sponsor") || p.includes("city_sponsor") || p.includes("takeover_sponsor") || p.includes("starter_sponsor")) {
      return [
        { label: "Sponsor setup", href: "/sponsors.html#activate", primary: true },
        { label: "Sponsor rotator", href: "/sponsor-rotator.html", primary: false },
      ];
    }

    // Label lanes
    if (p.includes("label") || p.includes("distribution") || p.includes("contract_lab")) {
      return [
        { label: "Label onboarding", href: "/label-onboarding.html", primary: true },
        { label: "Label submissions", href: "/label-submissions.html", primary: false },
        { label: "Contract Lab", href: "/label-contract-lab.html", primary: false },
      ];
    }

    // Social lanes
    if (p.includes("social") || p.includes("launch_campaign") || p.includes("imaging_pack")) {
      return [
        { label: "Start your social campaign", href: "/social-engine.html#submit", primary: true },
        { label: "Feature Engine", href: "/feature-engine.html", primary: false },
      ];
    }

    // Default
    return [
      { label: "Go to Engines", href: "/engines.html", primary: true },
      { label: "Pricing", href: "/pricing.html", primary: false },
      { label: "Radio Hub", href: "/radio-hub.html", primary: false },
    ];
  }

  if ($sess) $sess.textContent = sessionId ? sessionId : "—";
  if ($plan) $plan.textContent = planId ? planId : "—";
  if ($src) $src.textContent = qpPlan ? "querystring" : (lsPlan ? "localStorage" : "unknown");

  if (!planId) {
    setStatus("warn", "NO PLAN", "Couldn’t detect what you bought. Use Engines / Pricing below.");
    if ($steps) {
      $steps.appendChild(btn("Engines Hub", "/engines.html", true));
      $steps.appendChild(btn("Pricing", "/pricing.html"));
      $steps.appendChild(btn("Radio Hub", "/radio-hub.html"));
    }
    return;
  }

  setStatus("ok", "CONFIRMED", "Routing you to the correct engine…");
  const routes = routeFor(planId);

  if ($steps) {
    $steps.innerHTML = "";
    routes.forEach(r => $steps.appendChild(btn(r.label, r.href, !!r.primary)));
  }

  clearLastPlanSoon();
})();