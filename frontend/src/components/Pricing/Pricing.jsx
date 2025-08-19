// src/components/Pricing/Pricing.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../app/AuthProvider";
import { useSubscription } from "../../app/SubscriptionProvider"; // must exist from Step #2
import { openBillingPortal, PRICE_IDS, startCheckout } from "../../utils/stripeService";


const PLANS = [
  {
    key: "Marketing",
    name: "Marketing Plan",
    priceText: "$1.99 / month",
    description: "Great for small businesses.",
    features: ["Basic Analytics", "1 Admin User", "Email Support"],
  },
  {
    key: "Developer",
    name: "Developer Plan",
    priceText: "$5.99 / month",
    description: "For developers and growing teams.",
    features: ["Advanced API Access", "5 Admin Users", "Priority Support"],
  },
  {
    key: "Syndicator",
    name: "Syndicator Plan",
    priceText: "$9.99 / month",
    description: "For large teams and agencies.",
    features: ["Unlimited Users", "Dedicated Support", "Custom Integrations"],
  },
];

const tierToKey = (tier) => {
  const t = String(tier || "Free").toLowerCase();
  if (t === "marketing") return "Marketing";
  if (t === "developer") return "Developer";
  if (t === "syndicator") return "Syndicator";
  return null; // Free
};

export default function Pricing() {
  const { user } = useAuth();
  const { tier, subscriptions } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  const [busyKey, setBusyKey] = useState(null);

  const currentKey = tierToKey(tier);
  const hasActive = Array.isArray(subscriptions) && subscriptions.length > 0;

  const handleSubscribe = async (planKey) => {
    setBusyKey(planKey);

    // Not logged in → remember plan and go to login
    if (!user) {
      sessionStorage.setItem("pendingPlan", planKey);
      if (!location.pathname.includes("/login") && location.pathname !== "/") {
        navigate("/login", { state: { from: location } });
      }
      // Focus email box if present on same page
      document.querySelector('input[type="email"]')?.focus();
      setBusyKey(null);
      return;
    }

    // Already subscribed & clicked a different plan → open Billing Portal to change plan
    if (hasActive && currentKey && currentKey !== planKey) {
      try {
        await openBillingPortal(user.uid);
      } catch (e) {
        console.error(e);
        alert("Could not open billing portal. Please try again.");
      } finally {
        setBusyKey(null);
      }
      return;
    }

    // New subscription (or manage same plan → also handled by Portal button below)
    const priceId = PRICE_IDS[planKey];
    try {
      await startCheckout(user.uid, priceId);
    } catch (e) {
      console.error(e);
      alert("Could not start checkout. Please try again.");
      setBusyKey(null);
    }
  };

  const handleManageBilling = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    try {
      await openBillingPortal(user.uid);
    } catch (e) {
      console.error(e);
      alert("Could not open billing portal. Please try again.");
    }
  };

  return (
    <div className="pricing">
      <h1>Upgrade Your Subscription</h1>
      <p>Choose the perfect plan for your needs.</p>

      <div className="pricing-grid">
        {PLANS.map((p) => {
          const isCurrent = currentKey === p.key;
          const isOtherWhileActive = hasActive && currentKey && currentKey !== p.key;

          return (
            <div key={p.key} className="pricing-card">
              <h3>{p.name}</h3>
              <p className="muted">{p.description}</p>
              <div className="price">{p.priceText}</div>
              <ul className="features">
                {p.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>

              {isCurrent ? (
                <button className="btn secondary" onClick={handleManageBilling}>
                  Manage Billing
                </button>
              ) : (
                <button
                  className="btn primary"
                  disabled={busyKey === p.key}
                  onClick={() => handleSubscribe(p.key)}
                  title={
                    isOtherWhileActive
                      ? "You already have a subscription. Click to change plan in the Billing Portal."
                      : "Subscribe via Stripe"
                  }
                >
                  {user
                    ? isOtherWhileActive
                      ? `Change to ${p.key}`
                      : "Subscribe"
                    : "Login to Subscribe"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {busyKey && (
        <div className="confirmation-message">
          Working on your <b>{busyKey}</b> plan…
        </div>
      )}
    </div>
  );
}
