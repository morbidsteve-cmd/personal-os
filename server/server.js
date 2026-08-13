// Mission Control — backend for Tasks/Planner/Calendar/Shopping/Roadmap.
//
// Deliberately does NOT touch the Fishing Journal — that has its own separate
// server (fishing-journal.service, port 4100) so a friend's future Tailscale
// access can be scoped to just that port. This server runs alongside it on a
// different port and only knows about the five modules below.
//
// Generic key-value JSON store: each module's data is one opaque blob, matching
// how the frontend's Store.load(key, fallback)/Store.save(key, value) already
// treats it. No per-module route logic needed — just an allowlist of keys.

const express = require('express');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = process.env.MC_PORT || 4200;
const DATA_DIR = path.join(__dirname, 'data');

// The exact localStorage keys the frontend already uses (js/modules/*.js).
// :key becomes a filename on disk, so this doubles as a path-traversal guard —
// anything not in this list is rejected before it ever touches the filesystem.
const ALLOWED_KEYS = [
  'personal_os_tasks',
  'personal_os_planner',
  'personal_os_calendar',
  'personal_os_shopping',
  'personal_os_roadmap'
];

// ---- storage helpers ----

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function dataFile(key) {
  return path.join(DATA_DIR, `${key}.json`);
}

function readStore(key) {
  ensureDataDir();
  const file = dataFile(key);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`Failed to read ${key}.json:`, e);
    return null;
  }
}

function writeStore(key, value) {
  ensureDataDir();
  fs.writeFileSync(dataFile(key), JSON.stringify(value, null, 2), 'utf8');
}

// ---- app setup ----

const app = express();
app.use(express.json({ limit: '2mb' }));

// Same shared-secret pattern as fishing-journal.service. Tailscale/your home
// network is the real gate on who can reach this box at all — this header is
// just a second, cheap layer on top.
const MC_TOKEN = process.env.MC_TOKEN || 'change-me';
app.use((req, res, next) => {
  if (req.header('x-mc-token') !== MC_TOKEN) {
    return res.status(401).json({ error: 'Missing or invalid Mission Control token' });
  }
  next();
});

function validKey(req, res, next) {
  if (!ALLOWED_KEYS.includes(req.params.key)) {
    return res.status(400).json({ error: 'Unknown store key' });
  }
  next();
}

// GET the current blob for a key — used on module open / manual refresh
app.get('/api/store/:key', validKey, (req, res) => {
  res.json(readStore(req.params.key));
});

// PUT (overwrite) the blob for a key — whole-value sync, matching Store.save()
app.put('/api/store/:key', validKey, (req, res) => {
  const { key } = req.params;
  writeStore(key, req.body);
  broadcast({ type: 'store_updated', key, value: req.body });
  res.json(req.body);
});

// health check — confirm routing works before wiring up a client
app.get('/api/health', (req, res) => res.json({ ok: true }));

const server = app.listen(PORT, () => {
  console.log(`Mission Control server listening on port ${PORT}`);
});

// ---- live sync over WebSocket ----
// When one device writes a value, every other connected device gets pushed
// the change immediately. No consumer of this yet (the wall dashboard, which
// will want it, isn't built) but it's the same cost to add now as later.

const wss = new WebSocketServer({ server });

function broadcast(message) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === 1 /* OPEN */) client.send(payload);
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected' }));
});
