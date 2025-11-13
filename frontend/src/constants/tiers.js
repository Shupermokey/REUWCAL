// Rank defines privilege order. Adjust names to your exact tiers.
export const TIERS = Object.freeze({
  Free: "Free",
  Marketing: "Marketing",
  Developer: "Developer",
  Syndicator: "Syndicator",
});


const RANK = { Free: 0, Marketing: 1, Developer: 2, Syndicator: 3 };

// Map Stripe Price IDs → Tier (publishable, safe to expose).
// Put your actual Price IDs in .env and reference them here.
export const PRICE_TO_TIER = {
  [import.meta.env.VITE_STRIPE_PRICE_MARKETING]: TIERS.Marketing,
  [import.meta.env.VITE_STRIPE_PRICE_DEVELOPER]: TIERS.Developer,
  [import.meta.env.VITE_STRIPE_PRICE_SYNDICATOR]: TIERS.Syndicator,
};

export const tierRank = (tier) => RANK[tier] ?? 0;

export const meetsTier = (userTier, neededTier) =>
  tierRank(userTier || TIERS.Free) >= tierRank(neededTier || TIERS.Free);

// Given one or more Stripe subscription docs, figure out the highest tier.
export function resolveTierFromSubscriptions(subs = []) {
  let best = TIERS.Free;
  subs.forEach((s) => {
    // Stripe extension writes `items` array; each item has `price` with `id` and maybe `product`.
    const items = Array.isArray(s.items) ? s.items : [];
    items.forEach((it) => {
      const priceId = it?.price?.id || it?.price?.priceId; // handle variations
      const mapped = PRICE_TO_TIER[priceId];
      if (mapped && tierRank(mapped) > tierRank(best)) best = mapped;
    });
  });
  return best;
}
