TKFM FIX — STRIPE SCRIPTS BROKEN BY package.json type=module

If your project has:
  "type": "module"

Then Node scripts using require() can silently fail when executed from stdin (node -),
causing:
- empty parsed fields
- false "product create failed"
- lookup_key verify returning none

This patch makes all Stripe scripts ESM-safe by using:
  node --input-type=module
  import fs from 'node:fs'
