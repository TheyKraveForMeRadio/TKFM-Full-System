TKFM STATEMENTS + PAYOUTS (V1)

Pages:
- /owner-statements-console.html (import CSV statements + manage payouts)
- /royalty-statements.html (client view by email)

Functions:
- /.netlify/functions/statements-import (POST, owner)
- /.netlify/functions/statements-list (GET, owner)
- /.netlify/functions/statements-client (GET, by email)
- /.netlify/functions/payouts (GET owner/email; POST mark paid/unpaid)

Storage:
- v2/.tkfm/statements.json
- v2/.tkfm/payouts.json

CSV:
- Paste CSV with header row.
- Best columns: release_id OR project_title, email, net_amount, currency, territory, streams
