TKFM CONTRACT GATE PATCH

- Adds contract fields (status/url/sent_at/signed_at) to distribution requests.
- Enforces: cannot set status to Scheduled or Published unless contract_status == signed.
- Updates Owner Distribution Ops UI with contract controls.
- Updates Client Vault "My Releases" to show contract status + contract link when present.

Test:
1) Create test item in owner-distribution-ops.html
2) Try setting status Scheduled while Unsigned -> should fail with contract_not_signed.
3) Set contract URL and Mark Signed -> then set Scheduled -> should succeed.
