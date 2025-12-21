import Stripe from 'stripe';
import { verifyDJ } from './_helpers.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  try {
    const user = verifyDJ(event);
    const { mixtapeId, tier } = JSON.parse(event.body);

    const PRICES = {
      basic: process.env.STRIPE_PRICE_FEATURE_BASIC,
      pro: process.env.STRIPE_PRICE_FEATURE_PRO,
      elite: process.env.STRIPE_PRICE_FEATURE_ELITE
    };

    if (!PRICES[tier]) {
      return { statusCode: 400, body: 'Invalid tier' };
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRICES[tier],
          quantity: 1
        }
      ],
      metadata: {
        mixtapeId,
        tier,
        djId: user.id,
        type: 'feature'
      },
      success_url: `${process.env.SITE_DOMAIN}/dj.html?feature=success`,
      cancel_url: `${process.env.SITE_DOMAIN}/dj.html?feature=cancel`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    return { statusCode: 401, body: err.message };
  }
}
