
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export const handler = async function(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { priceId, metadata } = body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: process.env.SUCCESS_URL || (process.env.SITE_URL + '/success'),
      cancel_url: process.env.CANCEL_URL || (process.env.SITE_URL + '/cancel'),
      metadata: metadata || {}
    });
    await supabase.from('purchases').insert([{ price_id: priceId, session_id: session.id, status: 'pending', created_at: new Date().toISOString(), metadata: metadata || {} }]);
    return { statusCode:200, body: JSON.stringify({ checkoutUrl: session.url, sessionId: session.id }) };
  } catch (err) { console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};
