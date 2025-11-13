import { useSubscription } from "../app/providers/SubscriptionProvider";
import { meetsTier, TIERS } from "../constants/tiers";



export function useTier() {
  const { tier, isLoading, subscriptions, source } = useSubscription();
  return {
    tier,
    isLoading,
    subscriptions,
    source,
    isFree: tier === TIERS.Free,
    meets: (needed) => meetsTier(tier, needed),
  };
}
