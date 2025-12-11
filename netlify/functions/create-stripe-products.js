
/**
 * Auto-create Stripe products & prices from config/prices.json
 * Admin-only (uses verifyAdmin header token)
 */
const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const { verifyAdmin } = require('./_helpers');

exports.handler = async function(event) {
  try {
    verifyAdmin(event);
    const cfgPath = path.join(__dirname, '..', '..', 'config', 'prices.json');
    const cfg = JSON.parse(fs.readFileSync(cfgPath,'utf8'));
    const created = [];
    const existing = await stripe.products.list({limit:100,active:true});
    for(const key of Object.keys(cfg)){
      const item = cfg[key];
      const price = (typeof item === 'object' && item.price) ? item.price : (typeof item === 'string' ? Number(item) : (item.price || 0));
      const label = (typeof item === 'object' && item.label) ? item.label : key;
      if(!price || price<=0) continue;
      const found = existing.data.find(p => p.name === label);
      if(found){
        const prices = await stripe.prices.list({product: found.id, limit: 100});
        const unit = Math.round(Number(price)*100);
        if(!prices.data.find(pr => pr.unit_amount === unit)){
          const p = await stripe.prices.create({product: found.id, unit_amount: unit, currency: 'usd'});
          created.push({label, priceId: p.id});
        }
        continue;
      }
      const prod = await stripe.products.create({name: label, metadata: {source:'tkfm'}});
      const pr = await stripe.prices.create({product: prod.id, unit_amount: Math.round(Number(price)*100), currency: 'usd'});
      created.push({label, priceId: pr.id});
    }
    return { statusCode:200, body: JSON.stringify({ created }) };
  } catch (err) { console.error(err); return { statusCode:500, body: JSON.stringify({ error: err.message }) }; }
};
