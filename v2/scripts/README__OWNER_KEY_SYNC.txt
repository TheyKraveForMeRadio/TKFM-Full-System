TKFM NEXT POWER MOVE — OWNER KEY SYNC (STOP 401 UNAUTHORIZED)

Problem:
Owner endpoints return Unauthorized because your local TKFM_OWNER_KEY != Netlify env TKFM_OWNER_KEY.

Fix (recommended):
./scripts/tkfm-owner-key-sync-from-netlify.sh .

This pulls TKFM_OWNER_KEY from Netlify and writes:
- ./.tkfm_owner_key (local only)
- .env (TKFM_OWNER_KEY=...)

If you want the opposite (push local key to Netlify):
./scripts/tkfm-owner-key-push-to-netlify.sh .

Verify:
./scripts/tkfm-verify-owner-key-match.sh .

Also:
Owner boost analytics page will prompt once for the key if it isn't stored in localStorage.
