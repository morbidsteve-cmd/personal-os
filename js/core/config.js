// Mission Control connection settings, for the modules that sync (Tasks, Planner,
// Calendar, Shopping, Roadmap). The Fishing Journal is NOT part of this — it stays
// on localStorage / its own separate server (fishing-journal.service, port 4100).
//
// Defaults below match the server's own defaults for local testing (npm start with
// no env vars set). Before pointing this at the real Mission Control box:
//   1. Change MC_BASE_URL to http://192.168.1.68:4200
//   2. Change MC_TOKEN to match whatever MC_TOKEN the server is actually running with
//      (set via the systemd unit's Environment= line — never leave it as 'change-me'
//      on a box reachable over Tailscale)

const MC_BASE_URL = 'http://localhost:4200';
const MC_TOKEN = 'change-me';
