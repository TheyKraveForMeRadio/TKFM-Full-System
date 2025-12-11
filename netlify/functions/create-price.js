
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body || '{}');
    const { title, price } = body;
    if(!title || !price) return { statusCode:400, body: JSON.stringify({ error: 'Missing title or price' }) };
    const product = await stripe.products.create({ name: title, metadata: { source: 'tkfm' } });
    const priceObj = await stripe.prices.create({ unit_amount: Math.round(Number(price) * 100), currency: 'usd', product: product.id });
    return { statusCode:200, body: JSON.stringify({ productId: product.id, priceId: priceObj.id }) };
  } catch (err) { console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};
