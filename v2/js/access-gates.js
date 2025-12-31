/**
 * TKFM Access Gates (front-end)
 * - Owner-only pages: add <meta name="tkfm-access" content="owner" />
 * - Creator-only pages: add <meta name="tkfm-access" content="creator" />
 * - Elite-only pages: add <meta name="tkfm-access" content="elite" />
 *
 * Storage keys:
 * - tkfm_creatorStatus: "FREE" | "CREATOR" | "ELITE"
 * - tkfm_ownerStatus: "OWNER" (set by owner-login.html)
 */
(function () {
  const META = document.querySelector('meta[name="tkfm-access"]');
  if (!META) return;

  const need = (META.getAttribute("content") || "").trim().toLowerCase();
  const next = encodeURIComponent(location.pathname.replace(/^\//, "") + location.search + location.hash);

  try { document.documentElement.style.visibility = "hidden"; } catch (e) {}

  const creator = (localStorage.getItem("tkfm_creatorStatus") || "FREE").toUpperCase();
  const owner = (localStorage.getItem("tkfm_ownerStatus") || "").toUpperCase() === "OWNER";

  const tierRank = { "FREE": 0, "CREATOR": 1, "ELITE": 2 };
  const hasTier =
    (need === "free") ||
    (need === "creator" && tierRank[creator] >= 1) ||
    (need === "elite" && tierRank[creator] >= 2);

  const allow =
    (need === "owner" && owner) ||
    (need !== "owner" && hasTier) ||
    owner;

  if (!allow) {
    const target = (need === "owner") ? `owner-login.html?next=${next}` : `pricing.html`;
    location.replace(target);
    return;
  }

  try { document.documentElement.style.visibility = "visible"; } catch (e) {}
})();
