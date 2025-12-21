import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function handler(event) {
  try {
    const { mixtapeId } = JSON.parse(event.body);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_FEATURED, // 🔑 Stripe Price ID
          quantity: 1
        }
      ],
      metadata: {
        mixtapeId,
        featureType: 'featured'
      },
      success_url: `${process.env.SITE_DOMAIN}/dj.html?featured=success`,
      cancel_url: `${process.env.SITE_DOMAIN}/dj.html?featured=cancel`
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
