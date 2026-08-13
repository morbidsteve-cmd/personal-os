// Replaces the repeated loadX()/saveX() pairs every module used to write by hand.
//
// This is the one place all modules touch localStorage. Keeping it a single choke
// point is what let Mission Control sync get added below by changing only this
// file — no module's call sites needed to change.

const Store = {
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch (e) {
      console.error('Store.load failed for', key, e);
    }
    return fallback;
  },

  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Store.save failed for', key, e);
      return false;
    }
    if (SYNCED_KEYS.includes(key)) pushToServer(key, value);
    return true;
  }
};

// ---- Mission Control sync (Tasks / Planner / Calendar / Shopping / Roadmap only) ----
//
// The write to localStorage above always happens first and never waits on any of
// this — that's the "local-first" half of the spec's sync rule. What follows is the
// "sync when available" half: after every save, try to push the new value to
// Mission Control; if that fails (offline, server down), remember the key and
// retry later instead of losing the change. Fishing Journal's keys are never in
// SYNCED_KEYS, so none of this ever touches them.

const SYNCED_KEYS = [
  'personal_os_tasks',
  'personal_os_planner',
  'personal_os_calendar',
  'personal_os_shopping',
  'personal_os_roadmap'
];

const PENDING_SYNC_KEY = 'mission_control_pending_sync';
const EVER_SYNCED_KEY = 'mission_control_ever_synced';

function getPendingKeys() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_SYNC_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function setPendingKeys(keys) {
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(keys));
  updateSyncStatus();
}

function markPending(key) {
  const pending = getPendingKeys();
  if (!pending.includes(key)) setPendingKeys([...pending, key]);
}

function clearPending(key) {
  setPendingKeys(getPendingKeys().filter(k => k !== key));
}

function updateSyncStatus() {
  const el = document.getElementById('syncStatus');
  if (!el) return;
  const pendingCount = getPendingKeys().length;
  if (pendingCount > 0) {
    el.textContent = `${pendingCount} pending`;
  } else if (localStorage.getItem(EVER_SYNCED_KEY) === 'true') {
    el.textContent = 'Synced';
  } else {
    el.textContent = 'Local only';
  }
}

async function pushToServer(key, value) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${MC_BASE_URL}/api/store/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-mc-token': MC_TOKEN },
      body: JSON.stringify(value),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('Server responded ' + res.status);
    localStorage.setItem(EVER_SYNCED_KEY, 'true');
    clearPending(key);
  } catch (e) {
    markPending(key);
  }
}

function flushPendingSync() {
  getPendingKeys().forEach(key => {
    const value = Store.load(key, undefined);
    if (value !== undefined) pushToServer(key, value);
  });
}

window.addEventListener('online', flushPendingSync);
setInterval(flushPendingSync, 20000);
flushPendingSync(); // in case last session ended with unsynced writes still queued
updateSyncStatus();
