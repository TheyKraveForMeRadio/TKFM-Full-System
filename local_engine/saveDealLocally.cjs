// local_engine/saveDealLocally.cjs
// LOCAL ONLY — DOES NOT REQUIRE NETLIFY
// Used for pipeline testing without deployment or credits

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'deals.json');

function saveDealLocally(payload) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '[]');
    }

    const raw = fs.readFileSync(file, 'utf-8');
    const deals = raw.trim() ? JSON.parse(raw) : [];

    const newDeal = {
      ...payload,
      id: 'DL-' + Date.now(),
      savedAt: new Date().toISOString()
    };

    deals.push(newDeal);
    fs.writeFileSync(file, JSON.stringify(deals, null, 2));
    return { ok: true, deal: newDeal };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = { saveDealLocally };
