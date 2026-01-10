// TKFM Post-Checkout Router
// - Reads planId + session_id from URL
// - Verifies session (if available)
// - Writes unlock into localStorage (tkfm_user_features + tkfm_last_planId)
// - Routes to the correct next step with strong CTAs

(function () {
  const qs = new URLSearchParams(location.search);
  const planId = (qs.get("planId") || localStorage.getItem("tkfm_last_planId") || "").trim();
  const sessionId = (qs.get("session_id") || "").trim();

  const planOut = document.getElementById("planOut");
  const sessionOut = document.getElementById("sessionOut");
  const statusOut = document.getElementById("statusOut");
  const actions = document.getElementById("actions");

  planOut.textContent = planId || "UNKNOWN_PLAN";
  sessionOut.textContent = sessionId || "NO_SESSION_ID";

  function getStore(key) {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
  }
  function setStore(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  // Store last plan (helps recovery if Stripe doesn’t pass it back for some reason)
  if (planId) localStorage.setItem("tkfm_last_planId", planId);

  // Unlock feature locally
  if (planId) {
    const feats = getStore("tkfm_user_features");
    feats[planId] = true;
    setStore("tkfm_user_features", feats);
  }

  function btn(href, title, sub, gold) {
    const a = document.createElement("a");
    a.className = "btn" + (gold ? " btnGold" : "");
    a.href = href;
    a.innerHTML = `<span>${title}<br/><small>${sub}</small></span><span>→</span>`;
    return a;
  }

  function routeForPlan(pid) {
    const p = String(pid || "").toLowerCase();

    if (p.includes("video") || p.includes("visual") || p.includes("reels")) {
      return {
        primary: { href: "/video-engine.html", title: "Submit Video Assets", sub: "Upload visuals / reels / music video content" },
        secondary: { href: "/feature-engine.html", title: "Request Featured Placement", sub: "Upgrade placement + schedule drops" },
      };
    }

    if (p.includes("podcast")) {
      return {
        primary: { href: "/podcast-engine.html", title: "Submit Podcast Episode", sub: "Upload episode + cover + show notes" },
        secondary: { href: "/radio-tv.html", title: "See Featured TV", sub: "Your episode can hit the Featured lane" },
      };
    }

    if (p.includes("press") || p.includes("playlist") || p.includes("submission") || p.includes("interview")) {
      return {
        primary: { href: "/press-engine.html", title: "Submit Press / Pitch", sub: "Press run • playlist pitch • interviews" },
        secondary: { href: "/submissions.html", title: "Submit Music", sub: "Priority submission lane is unlocked" },
      };
    }

    if (p.includes("sponsor") || p.includes("takeover") || p.includes("city")) {
      return {
        primary: { href: "/sponsors.html", title: "Activate Sponsor Placement", sub: "Upload assets + pick rotation schedule" },
        secondary: { href: "/sponsor-engine-room.html", title: "Sponsor Engine Room", sub: "Track clicks + rotation + reporting" },
      };
    }

    if (p.includes("label") || p.includes("contract")) {
      return {
        primary: { href: "/label-onboarding.html", title: "Start Label Onboarding", sub: "Create your label profile + roster" },
        secondary: { href: "/label-contract-lab.html", title: "Open Contract Lab", sub: "Generate contracts + publish to catalog" },
      };
    }

    if (p.includes("mixtape") || p.includes("dj")) {
      return {
        primary: { href: "/dj-mixtape-hosting.html", title: "Mixtape Hosting Intake", sub: "Upload tracks + mix notes for DJ KRAVE" },
        secondary: { href: "/artist-upload.html", title: "Upload Music", sub: "Feed TKFM submissions pipeline" },
      };
    }

    return {
      primary: { href: "/pricing.html", title: "Go To Pricing", sub: "Pick your lane or add another boost" },
      secondary: { href: "/dashboard.html", title: "Open Dashboard", sub: "Manage your TKFM account" },
    };
  }

  function paintActions() {
    actions.innerHTML = "";
    const r = routeForPlan(planId);
    actions.appendChild(btn(r.primary.href, r.primary.title, r.primary.sub, true));
    actions.appendChild(btn(r.secondary.href, r.secondary.title, r.secondary.sub, false));
    actions.appendChild(btn("/radio-hub.html", "Back to Radio Hub", "Listen live + browse lanes", false));
  }

  async function verifySession() {
    if (!sessionId) {
      statusOut.innerHTML = `<span class="ok">Unlocked (local)</span>`;
      return;
    }
    try {
      const res = await fetch(`/.netlify/functions/checkout-session-get?session_id=${encodeURIComponent(sessionId)}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.stripeMessage || data.error || "verify failed");

      const ok = (data.payment_status === "paid") || (data.status === "complete");
      statusOut.innerHTML = ok ? `<span class="ok">Paid</span>` : `<span class="warn">${data.payment_status || data.status || "processing"}</span>`;

      // If Stripe metadata includes planId, prefer it
      const metaPlan = (data.metadata && (data.metadata.planId || data.metadata.plan_id)) ? String(data.metadata.planId || data.metadata.plan_id) : "";
      if (metaPlan && metaPlan !== planId) {
        localStorage.setItem("tkfm_last_planId", metaPlan);
      }
    } catch (e) {
      statusOut.innerHTML = `<span class="warn">Unlocked (verify skipped)</span>`;
    }
  }

  paintActions();
  verifySession();
})();