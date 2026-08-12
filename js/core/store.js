// Replaces the repeated loadX()/saveX() pairs every module used to write by hand.
//
// This is the one place all modules touch localStorage. Keeping it a single choke
// point matters for Phase 2: adding "local-first, sync when available" (queueing
// writes and pushing them to Mission Control over WebSocket when reachable) means
// changing Store.save() once, not retrofitting six modules individually.

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
      return true;
    } catch (e) {
      console.error('Store.save failed for', key, e);
      return false;
    }
  }
};
