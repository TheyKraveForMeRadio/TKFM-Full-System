// /v2/ai-core.js
// Central TKFM / Label AI helper brain.
// Phase 1: pure JS heuristics (no external calls yet).

// Simple helpers
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// 🔥 Artist readiness score (0–100)
export function scoreArtistReadiness({ socials = 0, catalog = 0, audioQuality = 0, consistency = 0 }) {
  const weights = {
    socials: 0.25,
    catalog: 0.25,
    audioQuality: 0.3,
    consistency: 0.2,
  };

  const raw =
    (socials * weights.socials) +
    (catalog * weights.catalog) +
    (audioQuality * weights.audioQuality) +
    (consistency * weights.consistency);

  return clamp(Math.round(raw), 0, 100);
}

// 💸 Price suggestion for a pack inside God View rails
export function suggestPriceRange({
  floor,       // minimum allowed (from God View)
  ceiling,     // max allowed
  readiness,   // 0–100 from scoreArtistReadiness or similar
  demand = 0.5 // 0–1 (how hot this lane is right now)
}) {
  const base = lerp(floor, ceiling, readiness / 100);
  const demandBoost = lerp(0.9, 1.25, demand); // 10% down → 25% up

  let mid = base * demandBoost;
  mid = clamp(mid, floor, ceiling);

  const spread = (ceiling - floor) * 0.12;
  const minSuggested = clamp(mid - spread, floor, ceiling);
  const maxSuggested = clamp(mid + spread, floor, ceiling);

  return {
    floor,
    ceiling,
    suggestedMin: Math.round(minSuggested),
    suggestedMax: Math.round(maxSuggested),
    mid: Math.round(mid),
  };
}

// 🧪 Sponsor lead score (0–100)
export function scoreSponsorLead({
  budget = 0,       // 0–1 normalized
  brandFit = 0,     // 0–1
  audienceOverlap = 0, // 0–1
  termLength = 0.5  // 0–1 (longer can be better)
}) {
  const weights = {
    budget: 0.35,
    brandFit: 0.35,
    audienceOverlap: 0.2,
    termLength: 0.1,
  };

  const raw =
    (budget * weights.budget) +
    (brandFit * weights.brandFit) +
    (audienceOverlap * weights.audienceOverlap) +
    (termLength * weights.termLength);

  return clamp(Math.round(raw * 100), 0, 100);
}

// 📊 Feature boost suggestion summary (plain text for now)
export function generateFeatureBoostPlan({ readinessScore, sponsorScore, platform = "tkfm" }) {
  const lines = [];

  if (platform === "tkfm") {
    if (readinessScore >= 75) {
      lines.push("Heavy TKFM feature rotation with leaderboard focus.");
      lines.push("Pair with at least one interview or live segment.");
    } else if (readinessScore >= 50) {
      lines.push("Medium feature rotation plus spotlight blocks.");
      lines.push("Warm up socials with coordinated drops.");
    } else {
      lines.push("Light feature rotation. Focus on tightening audio and roll-out plan.");
    }
  }

  if (sponsorScore >= 70) {
    lines.push("Flag this artist / pack as sponsor-ready inside the label sponsor engine.");
  } else if (sponsorScore >= 40) {
    lines.push("Keep sponsor notes warm, but treat as a future candidate.");
  } else {
    lines.push("Do not pitch to sponsors yet — keep development internal.");
  }

  return lines;
}
