#!/usr/bin/env bash
set -euo pipefail

# TKFM: generate a strong owner key (hex)
# Usage:
#   ./scripts/tkfm-gen-owner-key.sh > /tmp/tkfm_owner_key.txt
#   cat /tmp/tkfm_owner_key.txt | tr -d '\r\n'
#
# Note: does NOT store anywhere by itself.

node - <<'NODE'
import crypto from 'crypto';
process.stdout.write(crypto.randomBytes(48).toString('hex'));
NODE
echo
