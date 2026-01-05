TKFM FIX — BASH UNBOUND VARIABLE ($9)

Symptom:
./scripts/tkfm-stripe-ensure-boost-prices-with-lookup.sh: line XXX: $9: unbound variable

Cause:
We printed ($99) in an echo line, so Bash tried to expand $9 positional arg.

Fix:
Use "99 USD" instead of "$99" in messages.
Also normalizes nicknames to ASCII "BOOST - 7 DAYS" for max compatibility.
