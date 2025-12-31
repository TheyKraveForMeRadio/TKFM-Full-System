TKFM STATION CHAT PACK

Adds:
- Radio Hub layout that feels like a real station hub (player + now playing + Station Chat)
- Supabase Realtime chat (global room)
- Nav sanitizer for public pages (hides owner/dev links)

FILES:
- radio-hub.html (overwrites)
- src/station-chat.js (new)
- js/nav-sanitize.js (new)
- scripts/supabase-chat.sql (new)

REQUIRES:
- @supabase/supabase-js installed
  If you don't have it:
    npm i @supabase/supabase-js

SUPABASE SETUP:
1) Supabase Dashboard -> SQL Editor -> run scripts/supabase-chat.sql
2) Database -> Replication -> enable Realtime for public.chat_messages

TEST:
npx netlify dev
http://localhost:8888/radio-hub.html

If chat shows "not configured yet", it means table/policies/realtime are not enabled or env vars not present.
