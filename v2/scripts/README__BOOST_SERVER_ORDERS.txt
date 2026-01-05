TKFM NEXT POWER MOVE — SERVER-RECORDED BOOST ORDERS + REVENUE PANEL

Adds:
- netlify/functions/boost-order-record.js   (public, but verifies Stripe session is PAID, then records)
- netlify/functions/boost-orders-admin.js   (owner-only summary)
- js/tkfm-boost-orders-admin.js             (renders totals + recent orders)
- wiring scripts:
  - ./scripts/tkfm-wire-boost-orders-into-analytics.sh .
  - ./scripts/tkfm-wire-post-checkout-record-order.sh .

Why:
- LocalStorage unlock is great UX, but server orders = real revenue tracking + anti-fake.
- Owner analytics becomes a real money dashboard.

After applying:
1) ./scripts/tkfm-wire-boost-orders-into-analytics.sh .
2) ./scripts/tkfm-wire-post-checkout-record-order.sh .
3) netlify dev --port 8888
4) After a real purchase, open:
   http://localhost:8888/owner-boost-analytics.html
