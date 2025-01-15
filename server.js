import express, { json } from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv'; 

dotenv.config();


// Initialize Stripe with your secret key
const stripe_key = process.env.STRIPE_SECRET_KEY;
const stripe = Stripe(stripe_key); // Replace with your Stripe Secret Key

const app = express();
app.use(cors());
app.use(json()); // Parse JSON requests

// Define your price IDs from Stripe Dashboard. Make sure to update this in .env with non-test values
const prices = {
    free: 'price_1QefjxEgiGJZMTseqhni6OT9', // Replace with the actual price ID
    freetwo: 'price_1QeqNvEgiGJZMTseWFjYiTql', // Replace with the actual price ID
    market: 'price_1QefkuEgiGJZMTseD5g4kb1K',
    developer: 'price_1QeflXEgiGJZMTsepoBPEblg',
    syndicator: 'price_1QefmEEgiGJZMTsedxiwooup',
};


// Create Checkout Session endpoint
app.post('/create-checkout-session', async (req, res) => {
    const { tier } = req.body; // Get the selected tier from the request

    // Validate the tier
    if (!prices[tier]) {
        console.log("Here I am...")
        return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    try {
        // Create a Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: prices[tier], // Use the corresponding Price ID
                    quantity: 1,
                },
            ],
            mode: 'subscription', // Indicates it's for subscriptions
            success_url: 'http://localhost:5173/home', // Redirect URL on success
            cancel_url: 'http://localhost:5173/error',   // Redirect URL on cancel
        });

        res.json({ url: session.url }); // Send the session URL to the client
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/subscription', async (req, res) => {
    try {
        const customerId = req.user.stripeCustomerId; // Ensure you store Stripe's customer ID with your user
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
        });

        if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            const priceId = subscription.items.data[0].price.id; // Get the subscription tier
            res.json({ tier: priceId });
        } else {
            res.json({ tier: 'free' }); // Default to free if no active subscription
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to fetch subscription data' });
    }
});


// Start the server
app.listen(4000, () => console.log('Server running on port 4000'));
