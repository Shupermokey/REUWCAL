import React, { useState } from "react";
import { useAuth } from "../../app/AuthProvider"; 

const plans = [
  {
    name: "Marketing Plan",
    price: "$1.99 / month",
    description: "Great for small businesses.",
    features: ["Basic Analytics", "1 Admin User", "Email Support"],
    link: "https://buy.stripe.com/test_00g5ld2Yf51V6SQ8wA",
  },
  {
    name: "Developer Plan",
    price: "$5.99 / month",
    description: "For developers and growing teams.",
    features: ["Advanced API Access", "5 Admin Users", "Priority Support"],
    link: "https://buy.stripe.com/test_8wMdRJ6argKDfpm6op",
  },
  {
    name: "Syndicator Plan",
    price: "$9.99 / month",
    description: "For large teams and agencies.",
    features: ["Unlimited Users", "Dedicated Support", "Custom Integrations"],
    link: "https://buy.stripe.com/test_00gdRJdCTgKD7WUaEG",
  },
];

function Pricing() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);

  return (
    <div className="pricing-container">
      <h2 className="pricing-title">Upgrade Your Subscription</h2>
      <p className="pricing-subtitle">
        Choose the perfect plan for your needs.
      </p>

      <div className="pricing-grid">
        {plans.map((plan) => (
          <div key={plan.name} className="pricing-card">
            <h3 className="plan-title">{plan.name}</h3>
            <p className="plan-description">{plan.description}</p>
            <p className="plan-price">{plan.price}</p>

            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index} className="feature-item">
                  ✔ {feature}
                </li>
              ))}
            </ul>

            <a
              href={`${plan.link}?prefilled_email=${user?.email || ""}`}
              target="_blank"
            >
              Subscribe
            </a>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="confirmation-message">
          Redirecting you to Stripe to complete your {selectedPlan}{" "}
          subscription...
        </div>
      )}
    </div>
  );
}

export default Pricing;
