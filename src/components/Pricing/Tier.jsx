import React from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function Tier({level}) {

    const navigate = useNavigate();

    const handleTierSelection = async (tier) =>{
        const response = await fetch('http://localhost:4000/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tier }),
        });

        const session = await response.json();
        if (session.url) {
            window.location.href = session.url; // Redirect to Stripe Checkout
        }
    };

  return (
    <Elements stripe={stripePromise}>
        <div onClick={() => handleTierSelection(level)} className='tier'>{level}</div>
    </Elements>
  )
}

export default Tier