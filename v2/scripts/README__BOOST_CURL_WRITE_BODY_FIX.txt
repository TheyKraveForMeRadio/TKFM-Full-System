TKFM FIX — "curl: Failed writing body" and product create falsely failing.

This patch removes curl->pipe parsing and reads JSON from variables instead.

Run:
./scripts/tkfm-boost-bootstrap.sh
