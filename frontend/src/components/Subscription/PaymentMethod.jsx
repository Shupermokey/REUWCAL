import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const PaymentMethod = ({ token }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  console.log("🚀 Received Token in PaymentMethod:", token); // ✅ Debug log

  const handleUpdatePayment = async () => {
    if (!stripe || !elements) {
      alert("Stripe has not loaded yet.");
      return;
    }
    if (!token) {
      alert("User is not authenticated.");
      return;
    }

    setLoading(true);

    try {
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: "card",
        card: elements.getElement(CardElement),
      });

      if (error) {
        console.error("❌ Stripe Error:", error);
        alert(error.message);
        setLoading(false);
        return;
      }

      console.log("✅ Payment Method Created:", paymentMethod.id);

      const response = await fetch("http://localhost:4000/api/update-payment-method", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethodId: paymentMethod.id }),
      });

      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error("❌ Payment update failed:", error);
      alert("Failed to update payment method.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="subscription-payment-update-container">
      <h3>Update Payment Method</h3>
      <CardElement
  options={{
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
      },
    },
    hidePostalCode: true, // ✅ Hide postal code to reduce input conflicts
  }}
/>

      <button onClick={handleUpdatePayment} disabled={loading}>
        {loading ? "Updating..." : "Update Payment"}
      </button>
    </div>
  );
};

export default PaymentMethod;