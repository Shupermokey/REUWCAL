import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/providers/AuthProvider';
import { useTier } from '../../hooks/useTier';
import { meetsTier, TIERS } from '../../constants/tiers';


export default function ProtectedRoute({ minTier = TIERS.Free }) {
  const { user, loading: authLoading } = useAuth();
  const { tier, isLoading: tierLoading } = useTier();
  const location = useLocation();

  if (authLoading || tierLoading) {
    return <div style={{ padding: 16 }}>Loading…</div>;
  }

  if (!user) {
    // Not logged in → go to login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!meetsTier(tier, minTier)) {
    // Logged in but not enough privileges → take to Pricing (upsell)
    return <Navigate to="/pricing" replace state={{ from: location, need: minTier }} />;
  }

  return <Outlet />;
}
