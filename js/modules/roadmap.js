// Project Roadmap — status pills: Idea / Planning / In Progress / Done.

const ROADMAP_HTML = `
  <div class="module-header module-header--tight">
    <button class="back-btn" onclick="goHome()">←</button>
    <div class="display" style="font-size:19px; font-weight:600;">Project Roadmap</div>
  </div>
  <div class="list-add-row">
    <input type="text" id="roadmapInput" class="list-input" placeholder="Add a project...">
    <select id="roadmapStatusInput" class="list-select">
      <option>Idea</option>
      <option>Planning</option>
      <option selected>In Progress</option>
      <option>Done</option>
    </select>
    <button class="list-add-btn" onclick="addRoadmapItem()">+</button>
  </div>
  <div id="roadmapList"></div>
`;

document.getElementById('view-roadmap').innerHTML = ROADMAP_HTML;

const ROADMAP_KEY = 'personal_os_roadmap';

function loadRoadmap() {
  return Store.load(ROADMAP_KEY, []);
}
function saveRoadmap(list) {
  Store.save(ROADMAP_KEY, list);
}
let roadmapItems = loadRoadmap();

function roadmapStatusColor(s) {
  if (s === 'Done') return '#4A9A6A';
  if (s === 'In Progress') return '#C98A3F';
  if (s === 'Planning') return '#8B95A6';
  return '#6B7178'; // Idea
}

function addRoadmapItem() {
  const input = document.getElementById('roadmapInput');
  const title = input.value.trim();
  if (!title) return;
  roadmapItems.unshift({
    id: uid(),
    title: title,
    status: document.getElementById('roadmapStatusInput').value,
    createdAt: new Date().toISOString()
  });
  saveRoadmap(roadmapItems);
  input.value = '';
  renderRoadmap();
}
function cycleRoadmapStatus(id) {
  const order = ['Idea', 'Planning', 'In Progress', 'Done'];
  const item = roadmapItems.find(r => r.id === id);
  if (!item) return;
  const idx = order.indexOf(item.status);
  item.status = order[(idx + 1) % order.length];
  saveRoadmap(roadmapItems);
  renderRoadmap();
}
function deleteRoadmapItem(id) {
  roadmapItems = roadmapItems.filter(r => r.id !== id);
  saveRoadmap(roadmapItems);
  renderRoadmap();
}
function renderRoadmap() {
  const listEl = document.getElementById('roadmapList');
  if (roadmapItems.length === 0) {
    listEl.innerHTML = '<div class="list-empty">No projects tracked yet. Add one above.</div>';
    return;
  }
  listEl.innerHTML = roadmapItems.map(r => `
    <div class="list-card">
      <div class="list-title">${escapeHtml(r.title)}</div>
      <span onclick="cycleRoadmapStatus('${r.id}')" class="mono roadmap-status-pill" style="background:${roadmapStatusColor(r.status)}22; color:${roadmapStatusColor(r.status)}; border:1px solid ${roadmapStatusColor(r.status)}55;">${r.status}</span>
      <button class="list-delete" onclick="deleteRoadmapItem('${r.id}')">🗑</button>
    </div>
  `).join('');
}

Modules.register('roadmap', { render: renderRoadmap });
