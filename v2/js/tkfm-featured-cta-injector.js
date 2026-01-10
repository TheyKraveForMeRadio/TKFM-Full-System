/* TKFM Featured CTA Injector
 * Adds monetization CTAs into:
 *  - Featured TV section: #tkfmFeaturedTV
 *  - Featured Podcast lane: #tkfmFeaturedPodcastLane
 *
 * Uses the unified checkout function via data-feature ids.
 * Requires /js/tkfm-quick-checkout.js on the page.
 */
(function () {
  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function injectFeaturedTV() {
    const host = document.querySelector("#tkfmFeaturedTV");
    if (!host) return;

    if (host.querySelector("#tkfmFeaturedTVCtas")) return;

    const block = el(`
      <div id="tkfmFeaturedTVCtas" class="mt-3 mb-4 flex flex-wrap gap-2 items-center">
        <button class="px-3 py-2 rounded-xl border border-cyan-400/40 bg-slate-900/60 text-cyan-200 hover:bg-slate-900/80"
          data-feature="video_monthly_visuals" title="Monthly Visuals Lane (Checkout)">
          Monthly Visuals Lane $249/mo
        </button>
        <a class="px-3 py-2 rounded-xl border border-fuchsia-400/40 bg-slate-900/60 text-fuchsia-200 hover:bg-slate-900/80"
          href="/pricing.html#video" data-force-checkout="0" title="See video pricing">
          View Video Pricing
        </a>
        <span class="text-slate-300 text-sm opacity-80">
          (If embed blocks, “Open” still works.)
        </span>
      </div>
    `);

    // Insert near top of section
    host.insertBefore(block, host.firstElementChild?.nextSibling || null);
  }

  function injectFeaturedPodcasts() {
    const lane = document.querySelector("#tkfmFeaturedPodcastLane");
    if (!lane) return;

    if (lane.querySelector("#tkfmFeaturedPodcastCtas")) return;

    const block = el(`
      <div id="tkfmFeaturedPodcastCtas" class="mt-2 flex flex-wrap gap-2 items-center">
        <button class="px-3 py-2 rounded-xl border border-cyan-400/40 bg-slate-900/60 text-cyan-200 hover:bg-slate-900/80"
          data-feature="podcast_interview" title="Book a Podcast Interview (Checkout)">
          Book Podcast Interview
        </button>
        <a class="px-3 py-2 rounded-xl border border-fuchsia-400/40 bg-slate-900/60 text-fuchsia-200 hover:bg-slate-900/80"
          href="/pricing.html#podcast" data-force-checkout="0" title="See podcast pricing">
          View Podcast Pricing
        </a>
      </div>
    `);

    // Put right under the lane title/header area if present
    const header = lane.querySelector("div") || lane;
    header.appendChild(block);
  }

  function run() {
    injectFeaturedTV();
    injectFeaturedPodcasts();
    // Allow other scripts to wire checkout after injection
    try { window.dispatchEvent(new Event("tkfm:wireCheckout")); } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", () => {
    run();
    // If lanes load after fetch, retry a few times
    let n = 0;
    const timer = setInterval(() => {
      n += 1;
      run();
      if (n >= 20) clearInterval(timer); // ~10s
    }, 500);
  });
})();
