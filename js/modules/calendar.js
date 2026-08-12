// Calendar — month view, tap-to-add events per day.

const CALENDAR_HTML = `
  <div class="module-header module-header--tight">
    <button class="back-btn" onclick="goHome()">←</button>
    <div class="display" style="font-size:19px; font-weight:600;">Calendar</div>
  </div>
  <div class="calendar-nav-row">
    <button class="step-btn" onclick="shiftCalendarMonth(-1)">‹</button>
    <div class="display calendar-month-label" id="calendarMonthLabel">Month Year</div>
    <button class="step-btn" onclick="shiftCalendarMonth(1)">›</button>
  </div>
  <div id="calendarGrid" class="calendar-grid"></div>
  <div id="calendarDayPanel"></div>
`;

document.getElementById('view-calendar').innerHTML = CALENDAR_HTML;

const CALENDAR_KEY = 'personal_os_calendar';
let calendarViewDate = new Date();
let calendarSelectedDate = null;

function loadCalendarEvents() {
  return Store.load(CALENDAR_KEY, {});
}
function saveCalendarEvents(data) {
  Store.save(CALENDAR_KEY, data);
}
let calendarEvents = loadCalendarEvents();

function shiftCalendarMonth(delta) {
  calendarViewDate.setMonth(calendarViewDate.getMonth() + delta);
  renderCalendar();
}

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function renderCalendar() {
  const y = calendarViewDate.getFullYear();
  const m = calendarViewDate.getMonth();
  document.getElementById('calendarMonthLabel').textContent =
    calendarViewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayKey = new Date().toISOString().slice(0, 10);

  let cells = ['S','M','T','W','T','F','S'].map(d =>
    `<div class="mono calendar-weekday">${d}</div>`
  );
  for (let i = 0; i < firstDay; i++) cells.push('<div></div>');
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(y, m, d);
    const hasEvents = calendarEvents[key] && calendarEvents[key].length > 0;
    const isToday = key === todayKey;
    const isSelected = key === calendarSelectedDate;
    const classes = ['calendar-day'];
    if (isToday) classes.push('today');
    if (isSelected) classes.push('selected');
    cells.push(`
      <div class="${classes.join(' ')}" onclick="selectCalendarDay('${key}')">
        ${d}
        ${hasEvents ? '<div class="calendar-day-dot"></div>' : ''}
      </div>
    `);
  }
  document.getElementById('calendarGrid').innerHTML = cells.join('');
  renderCalendarDayPanel();
}

function selectCalendarDay(key) {
  calendarSelectedDate = key;
  renderCalendar();
}

function renderCalendarDayPanel() {
  const panel = document.getElementById('calendarDayPanel');
  if (!calendarSelectedDate) {
    panel.innerHTML = '<div class="calendar-day-panel-hint">Tap a day to see or add events.</div>';
    return;
  }
  const events = calendarEvents[calendarSelectedDate] || [];
  panel.innerHTML = `
    <div class="display calendar-day-panel-title">${formatDate(calendarSelectedDate)}</div>
    <div class="calendar-add-row">
      <input type="text" id="calendarEventInput" placeholder="Add event...">
      <button onclick="addCalendarEvent()">+</button>
    </div>
    ${events.length === 0 ? '<div class="calendar-event-empty">No events this day.</div>' :
      events.map(e => `
        <div class="calendar-event-row">
          <div class="calendar-event-title">${escapeHtml(e.title)}</div>
          <button class="list-delete" onclick="deleteCalendarEvent('${e.id}')">🗑</button>
        </div>
      `).join('')}
  `;
}

function addCalendarEvent() {
  const input = document.getElementById('calendarEventInput');
  const title = input.value.trim();
  if (!title || !calendarSelectedDate) return;
  if (!calendarEvents[calendarSelectedDate]) calendarEvents[calendarSelectedDate] = [];
  calendarEvents[calendarSelectedDate].push({ id: uid(), title: title });
  saveCalendarEvents(calendarEvents);
  renderCalendar();
}

function deleteCalendarEvent(id) {
  if (!calendarSelectedDate) return;
  calendarEvents[calendarSelectedDate] = (calendarEvents[calendarSelectedDate] || []).filter(e => e.id !== id);
  saveCalendarEvents(calendarEvents);
  renderCalendar();
}

Modules.register('calendar', { render: renderCalendar });
