TKFM NEXT POWER MOVE — DASHBOARD CONTROL ROOM (USER + OWNER LINKS)

Adds:
- dashboard.html (neon control room)
- scripts/tkfm-wire-dashboard-pill-links.sh (adds a floating Dashboard pill to core pages)
- scripts/tkfm-verify-dashboard-control-room.sh

Run:
./scripts/tkfm-wire-dashboard-pill-links.sh .
./scripts/tkfm-verify-dashboard-control-room.sh
netlify dev --port 8888

Open:
http://localhost:8888/dashboard.html
