TKFM NEXT POWER MOVE — BOOST ENV SNAPSHOTS (TEST <-> LIVE SWITCH)

Why:
You’re running both TEST and LIVE. Switching Netlify env by hand is error-prone.

This adds:
- scripts/tkfm-boost-env-snapshot.sh  (save current Netlify/.env Boost ids to a file)
- scripts/tkfm-boost-env-apply.sh     (apply a snapshot file back to Netlify env)

Example:
# save current (test)
./scripts/tkfm-boost-env-snapshot.sh test

# after wiring live, save live too
./scripts/tkfm-boost-env-snapshot.sh live

# switch to live later
./scripts/tkfm-boost-env-apply.sh .tkfm_boost_env_live.txt

# switch back to test
./scripts/tkfm-boost-env-apply.sh .tkfm_boost_env_test.txt
