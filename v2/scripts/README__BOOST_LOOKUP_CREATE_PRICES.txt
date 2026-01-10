TKFM FIX — STRIPE LOOKUP KEYS CAN'T BE UPDATED (CREATE NEW PRICES)

If you see:
  lookup_key is 'none' (expected rotation_boost_7d)

Your Stripe account/API version is blocking updating lookup_key on existing prices.

Solution:
Create new Prices with lookup_key set AT CREATE-TIME.

Run:
export STRIPE_SECRET_KEY=sk_live_...
./scripts/tkfm-stripe-ensure-boost-prices-with-lookup.sh
./scripts/tkfm-boost-go-live.sh

Output will print:
STRIPE_PRODUCT_ROTATION_BOOST=prod_...
STRIPE_PRICE_ROTATION_BOOST_7D=price_...
STRIPE_PRICE_ROTATION_BOOST_30D=price_...

And will set Netlify env automatically (if netlify CLI is installed).
