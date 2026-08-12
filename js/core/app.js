// App shell: module registry + navigation between the home grid and each module's view.
//
// Every module calls Modules.register(id, { render }) at the bottom of its own file. This file
// never needs editing when a module is added (Notes, Idea Dump, ...) as long as it follows the
// same convention: a <div class="module-view" id="view-<id>"> container in index.html, and a
// self-registering render function.

const Modules = {
  _registry: {},
  register(id, mod) { this._registry[id] = mod; },
  get(id) { return this._registry[id]; }
};

const MODULES = [
  { id: 'tasks', icon: '✅', name: 'Task Manager', status: 'Built — local only', live: true },
  { id: 'notes', icon: '📝', name: 'Notes', status: 'Live', live: true },
  { id: 'planner', icon: '🗓', name: 'Daily Planner', status: 'Built — local only', live: true },
  { id: 'calendar', icon: '📅', name: 'Calendar', status: 'Built — local only', live: true },
  { id: 'shopping', icon: '🛒', name: 'Shopping List', status: 'Built — local only', live: true },
  { id: 'journal', icon: '🎣', name: 'Fishing Journal', status: 'Built — not synced' },
  { id: 'roadmap', icon: '🧭', name: 'Project Roadmap', status: 'Built — local only', live: true },
  { id: 'ideas', icon: '💡', name: 'Idea Dump', status: 'Live', live: true }
];

function renderModuleGrid() {
  const grid = document.getElementById('moduleGrid');
  grid.innerHTML = MODULES.map(m => `
    <div class="module-card" onclick="openModule('${m.id}')">
      <div class="module-icon">${m.icon}</div>
      <div class="module-name display">${m.name}</div>
      <div class="module-status mono ${m.live ? 'live' : ''}">${m.status}</div>
    </div>
  `).join('');
}

function hideAllViews() {
  document.querySelectorAll('.module-view').forEach(el => el.classList.remove('active'));
}

function goHome() {
  hideAllViews();
  document.getElementById('view-home').classList.add('active');
  document.getElementById('navHome').classList.add('active');
}

function openModule(id) {
  const m = MODULES.find(x => x.id === id);
  if (!m) return;
  document.getElementById('navHome').classList.remove('active');
  hideAllViews();

  const mod = Modules.get(id);
  const viewEl = document.getElementById('view-' + id);
  if (mod && viewEl) {
    viewEl.classList.add('active');
    mod.render();
    return;
  }

  // Not built yet — show the generic "coming soon" placeholder.
  document.getElementById('view-module').classList.add('active');
  document.getElementById('moduleTitle').textContent = m.name;
  document.getElementById('modulePlaceholderIcon').textContent = m.icon;
  document.getElementById('modulePlaceholderTitle').textContent = m.live ? 'Live in the full build' : 'Coming soon';
  document.getElementById('modulePlaceholderSub').textContent = m.live
    ? 'This module is already working in Mission Control — wiring it into this shell is next.'
    : 'This module is on the build order but not started yet.';
}

renderModuleGrid();
