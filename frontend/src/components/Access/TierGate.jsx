import { TIERS, meetsTier } from '@/constants/tiers';
import { useTier } from '@/hooks/useTier';
import { Link } from 'react-router-dom';

export default function TierGate({ min = TIERS.Free, fallback = null, children }) {
  const { tier, isLoading } = useTier();
  if (isLoading) return null;

  if (!meetsTier(tier, min)) {
    return (
      fallback || (
        <div className="tier-locked">
          <p>This feature requires the {min} plan.</p>
          <Link to="/pricing">See plans</Link>
        </div>
      )
    );
  }
  return <>{children}</>;
}
