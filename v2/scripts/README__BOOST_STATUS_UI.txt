TKFM NEXT POWER MOVE — USER BOOST STATUS (DAYS LEFT) ON DASHBOARD + BOOST PAGE

Adds:
- js/tkfm-boost-status-ui.js
- Wiring scripts:
  - ./scripts/tkfm-wire-boost-status-ui.sh .
  - ./scripts/tkfm-verify-boost-status-ui.sh

What you get:
- User sees active Boost (7d/30d) + expiry countdown.
- Expired entitlements auto-prune from localStorage.
- Big CTA to "Buy / Submit Boost" everywhere.

Run:
./scripts/tkfm-wire-boost-status-ui.sh .
./scripts/tkfm-verify-boost-status-ui.sh
netlify dev --port 8888
Open:
http://localhost:8888/dashboard.html
http://localhost:8888/rotation-boost.html
