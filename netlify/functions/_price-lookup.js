// Map your site "keys" to Stripe lookup_keys.
// You control what is sellable by what appears here.
export const LOOKUP_KEYS = {
  // Submissions
  submit_basic: "submit_basic",
  submit_boost: "submit_boost",
  submit_spotlight: "submit_spotlight",

  // Artist memberships (examples)
  sub_basic: "sub_basic",
  sub_pro: "sub_pro",
  sub_elite: "sub_elite",

  // DJ (examples)
  dj_monthly: "dj_monthly",
  dj_pro_monthly: "dj_pro_monthly",
  dj_elite_monthly: "dj_elite_monthly",

  // Sponsors (examples)
  sponsor_bronze: "sponsor_bronze",
  sponsor_silver: "sponsor_silver",
  sponsor_gold: "sponsor_gold",
};

// Optional: for one-time products vs subscriptions
export const MODE_BY_KEY = {
  // submissions & sponsors are usually one-time payments
  submit_basic: "payment",
  submit_boost: "payment",
  submit_spotlight: "payment",
  sponsor_bronze: "payment",
  sponsor_silver: "payment",
  sponsor_gold: "payment",

  // memberships / dj are usually recurring
  sub_basic: "subscription",
  sub_pro: "subscription",
  sub_elite: "subscription",
  dj_monthly: "subscription",
  dj_pro_monthly: "subscription",
  dj_elite_monthly: "subscription",
};
