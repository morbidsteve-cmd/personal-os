// Daily Planner — date-based time-blocked entries.

const PLANNER_HTML = `
  <div class="module-header module-header--tight">
    <button class="back-btn" onclick="goHome()">←</button>
    <div class="display" style="font-size:19px; font-weight:600;">Daily Planner</div>
  </div>
  <div class="planner-date-row">
    <button class="step-btn" onclick="shiftPlannerDay(-1)">‹</button>
    <input type="date" id="plannerDateInput" onchange="onPlannerDateChange()" class="planner-date-input">
    <button class="step-btn" onclick="shiftPlannerDay(1)">›</button>
  </div>
  <div class="list-add-row">
    <input type="time" id="plannerTimeInput" class="list-input planner-time-input">
    <input type="text" id="plannerActivityInput" placeholder="What's happening..." class="list-input">
    <button class="list-add-btn" onclick="addPlannerItem()">+</button>
  </div>
  <div id="plannerList"></div>
`;

document.getElementById('view-planner').innerHTML = PLANNER_HTML;

const PLANNER_KEY = 'personal_os_planner';
let plannerDate = new Date().toISOString().slice(0, 10);

function loadPlanner() {
  return Store.load(PLANNER_KEY, {});
}
function savePlanner(data) {
  Store.save(PLANNER_KEY, data);
}
let plannerData = loadPlanner();

function shiftPlannerDay(delta) {
  const d = new Date(plannerDate + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  plannerDate = d.toISOString().slice(0, 10);
  document.getElementById('plannerDateInput').value = plannerDate;
  renderPlanner();
}
function onPlannerDateChange() {
  plannerDate = document.getElementById('plannerDateInput').value;
  renderPlanner();
}
function addPlannerItem() {
  const activity = document.getElementById('plannerActivityInput').value.trim();
  if (!activity) return;
  if (!plannerData[plannerDate]) plannerData[plannerDate] = [];
  plannerData[plannerDate].push({
    id: uid(),
    time: document.getElementById('plannerTimeInput').value,
    activity: activity
  });
  plannerData[plannerDate].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  savePlanner(plannerData);
  document.getElementById('plannerActivityInput').value = '';
  renderPlanner();
}
function deletePlannerItem(id) {
  if (!plannerData[plannerDate]) return;
  plannerData[plannerDate] = plannerData[plannerDate].filter(i => i.id !== id);
  savePlanner(plannerData);
  renderPlanner();
}
function renderPlanner() {
  document.getElementById('plannerDateInput').value = plannerDate;
  const items = plannerData[plannerDate] || [];
  const listEl = document.getElementById('plannerList');
  if (items.length === 0) {
    listEl.innerHTML = '<div class="list-empty">Nothing planned for this day yet.</div>';
    return;
  }
  listEl.innerHTML = items.map(i => `
    <div class="list-card">
      <div class="mono planner-item-time">${i.time || '--:--'}</div>
      <div class="list-title">${escapeHtml(i.activity)}</div>
      <button class="list-delete" onclick="deletePlannerItem('${i.id}')">🗑</button>
    </div>
  `).join('');
}

Modules.register('planner', { render: renderPlanner });
