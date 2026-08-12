// Task Manager — priority, due dates, active/completed.

const TASKS_HTML = `
  <div class="module-header module-header--tight">
    <button class="back-btn" onclick="goHome()">←</button>
    <div class="display" style="font-size:19px; font-weight:600;">Task Manager</div>
  </div>

  <div class="list-add-row">
    <input type="text" id="taskInput" class="list-input" placeholder="Add a task...">
    <select id="taskPriorityInput" class="list-select">
      <option value="Low">Low</option>
      <option value="Medium" selected>Medium</option>
      <option value="High">High</option>
    </select>
    <button class="list-add-btn" onclick="addTask()">+</button>
  </div>
  <input type="date" id="taskDueInput" class="list-secondary-input">

  <div id="taskActiveSection"></div>
  <div id="taskCompletedSection" style="margin-top:20px;"></div>
`;

document.getElementById('view-tasks').innerHTML = TASKS_HTML;

const TASKS_KEY = 'personal_os_tasks';

function loadTasks() {
  return Store.load(TASKS_KEY, []);
}
function saveTasks(list) {
  Store.save(TASKS_KEY, list);
}

let tasks = loadTasks();

function addTask() {
  const input = document.getElementById('taskInput');
  const title = input.value.trim();
  if (!title) return;
  tasks.unshift({
    id: uid(),
    title: title,
    priority: document.getElementById('taskPriorityInput').value,
    dueDate: document.getElementById('taskDueInput').value,
    completed: false,
    createdAt: new Date().toISOString()
  });
  saveTasks(tasks);
  input.value = '';
  document.getElementById('taskDueInput').value = '';
  renderTasks();
}

function toggleTask(id) {
  const t = tasks.find(x => x.id === id);
  if (t) t.completed = !t.completed;
  saveTasks(tasks);
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(x => x.id !== id);
  saveTasks(tasks);
  renderTasks();
}

function priorityColor(p) {
  if (p === 'High') return '#D99B85';
  if (p === 'Medium') return '#C98A3F';
  return '#6B7178';
}

function taskCardHtml(t) {
  const overdue = t.dueDate && !t.completed && new Date(t.dueDate) < new Date(new Date().toDateString());
  return `
    <div class="list-card task-card ${t.completed ? 'done' : ''}">
      <div class="list-checkbox ${t.completed ? 'checked' : ''}" onclick="toggleTask('${t.id}')">${t.completed ? '✓' : ''}</div>
      <div class="task-body">
        <div class="list-title ${t.completed ? 'done' : ''}">${escapeHtml(t.title)}</div>
        <div class="task-meta">
          <span style="color:${priorityColor(t.priority)};">● ${t.priority}</span>
          ${t.dueDate ? `<span style="color:${overdue ? '#D99B85' : '#6B7178'};">${overdue ? '⚠ ' : ''}Due ${formatDate(t.dueDate)}</span>` : ''}
        </div>
      </div>
      <button class="list-delete" onclick="deleteTask('${t.id}')">🗑</button>
    </div>
  `;
}

function renderTasks() {
  const active = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  const activeEl = document.getElementById('taskActiveSection');
  activeEl.innerHTML = active.length === 0
    ? '<div class="list-empty">No active tasks. Add one above.</div>'
    : active.map(taskCardHtml).join('');

  const completedEl = document.getElementById('taskCompletedSection');
  completedEl.innerHTML = completed.length === 0 ? '' :
    `<div class="list-section-label">Completed (${completed.length})</div>` + completed.map(taskCardHtml).join('');
}

Modules.register('tasks', { render: renderTasks });
