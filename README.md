
TKFM FULL PRODUCTION Repo — Final Build (Neon Purple, React + Vite, Netlify Functions)

Quick deploy checklist:
1. Create a GitHub repo and push these files (do NOT commit secrets).
2. In Netlify, connect the repo (Import from Git).
3. Add environment variables from .env.example in Netlify Site Settings.
4. Run the SQL migration (sql/001_production.sql) in Supabase.
5. Create Supabase storage buckets: mixtape-audio (private), mixtape-covers (public or private).
6. (Optional) Use `netlify dev` locally to test functions.
7. Deploy.
8. As admin, call `/.netlify/functions/create-stripe-products` with Authorization Bearer <admin_jwt> to auto-create Stripe products/prices from config/prices.json.
9. Test purchase flow with Stripe test cards. Use logs in Netlify Functions for debugging.

If you want I can push this to your GitHub repo or help configure Netlify.


ULTRA-NEON PRO added: /src/fx/ultra-engine.js (WebGL2) with canvas fallback, OnAir component, AudioBars, neon hover effects.
