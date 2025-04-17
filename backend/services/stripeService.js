import Stripe from "stripe";
import { config } from "dotenv";

config({ path: "./.env" }); // Load environment variables

// ✅ Initialize Stripe with Secret Key from .env
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // ✅ Use the latest stable API version
});

/**
 * ✅ Create a new Stripe customer
 * @param {string} email - The user's email
 * @param {string} uid - The Firebase UID
 * @returns {Promise<Object>} - Stripe customer object
 */
export const createStripeCustomer = async (email, uid) => {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata: { uid },
    });
    console.log(`✅ Stripe customer created: ${customer.id}`);
    return customer;
  } catch (error) {
    console.error("❌ Error creating Stripe customer:", error.message);
    throw error;
  }
};

/**
 * ✅ Update a customer's subscription
 * @param {string} subscriptionId - The Stripe Subscription ID
 * @param {string} newPriceId - The new price ID for the subscription
 * @returns {Promise<Object>} - Updated subscription object
 */
export const updateSubscription = async (subscriptionId, newPriceId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [{ id: subscription.items.data[0].id, price: newPriceId }],
        proration_behavior: "create_prorations",
      }
    );

    console.log(
      `✅ Subscription updated: ${subscriptionId} → New Price: ${newPriceId}`
    );
    return updatedSubscription;
  } catch (error) {
    console.error("❌ Error updating subscription:", error.message);
    throw error;
  }
};

/**
 * ✅ Cancel a subscription (immediately or at the end of billing cycle)
 * @param {string} subscriptionId - The Stripe Subscription ID
 * @param {boolean} immediate - Whether to cancel immediately
 * @returns {Promise<Object>} - Canceled subscription object
 */
export const cancelSubscription = async (subscriptionId, immediate = false) => {
  try {
    const cancellationData = immediate
      ? await stripe.subscriptions.del(subscriptionId)
      : await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });

    console.log(
      `✅ Subscription ${
        immediate ? "canceled immediately" : "set to cancel at end of period"
      }: ${subscriptionId}`
    );
    return cancellationData;
  } catch (error) {
    console.error("❌ Error canceling subscription:", error.message);
    throw error;
  }
};

/**
 * ✅ Update a customer's default payment method
 * @param {string} customerId - The Stripe Customer ID
 * @param {string} paymentMethodId - The new payment method ID
 * @returns {Promise<Object>} - Updated customer object
 */
export const updatePaymentMethod = async (customerId, paymentMethodId) => {
  try {
    // Attach new payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set the payment method as the default
    const updatedCustomer = await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    console.log(`✅ Updated payment method for customer: ${customerId}`);
    return updatedCustomer;
  } catch (error) {
    console.error("❌ Error updating payment method:", error.message);
    throw error;
  }
};
