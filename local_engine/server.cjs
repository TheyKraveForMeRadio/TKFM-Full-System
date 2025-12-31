// local_engine/server.cjs
// Tiny local server so onboarding page can POST without Netlify
// and label HQ can GET the deals list.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { saveDealLocally } = require('./saveDealLocally.cjs');

const dealsFile = path.join(__dirname, 'deals.json');

const server = http.createServer((req, res) => {
  // CORS so localhost:5173 can talk to localhost:3001
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // POST /save-deal → append a deal into deals.json
  if (req.url === '/save-deal' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        const result = saveDealLocally(json);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Bad JSON' }));
      }
    });
    return;
  }

  // GET /deals → return all deals
  if (req.url === '/deals' && req.method === 'GET') {
    try {
      if (!fs.existsSync(dealsFile)) {
        fs.writeFileSync(dealsFile, '[]');
      }
      const raw = fs.readFileSync(dealsFile, 'utf-8');
      const deals = raw.trim() ? JSON.parse(raw) : [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, deals }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  // Fallback
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(3001, () => {
  console.log('🟡 LOCAL DEAL SERVER RUNNING → http://localhost:3001');
  console.log('   POST /save-deal');
  console.log('   GET  /deals');
});
