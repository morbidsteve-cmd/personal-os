// Mission Control connection settings, for the modules that sync (Tasks, Planner,
// Calendar, Shopping, Roadmap). The Fishing Journal is NOT part of this — it stays
// on localStorage / its own separate server (fishing-journal.service, port 4100).
//
// Points at the real Mission Control box. MC_TOKEN here must match the MC_TOKEN
// set in mission-control.service's Environment= line on that box — if you ever
// regenerate the token, update both places together or sync will start failing
// silently (queued locally, never landing on the server).
//
// For local testing against a server running on this machine instead, temporarily
// swap MC_BASE_URL back to 'http://localhost:4200' and MC_TOKEN to whatever you
// started that local server with.

const MC_BASE_URL = 'http://192.168.1.68:4200';
const MC_TOKEN = 'f8d0db72f97ee2fccdf30b0c30db4980';
