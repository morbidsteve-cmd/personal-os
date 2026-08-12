// Fishing Journal — sessions, catches, kit inventory, pre-trip checklist, gallery, photos, GPS.
// Self-contained: this file owns its own markup (injected into #view-journal below) and all its logic.

const JOURNAL_HTML = `
  <div class="module-header" style="margin-bottom:8px;">
    <button class="back-btn" onclick="goHome()">←</button>
    <div class="display" style="font-size:19px; font-weight:600;">Fishing Journal</div>
  </div>

  <div class="wrap">
    <div class="header">
      <div class="header-left">
        <div class="icon-badge">🐟</div>
        <div>
          <h1 class="serif">The Logbook</h1>
          <div class="subtitle" id="subtitle">0 sessions logged</div>
        </div>
      </div>
      <div class="header-actions">
        <button class="icon-btn" onclick="exportEntries()" title="Export backup">⬇</button>
        <button class="icon-btn" onclick="document.getElementById('importFile').click()" title="Import backup">⬆</button>
        <input type="file" id="importFile" accept=".json" onchange="importEntries(event)">
      </div>
    </div>

    <div class="main-nav">
      <div class="main-nav-item active" id="navJournal" onclick="setMainSection('journal')">📖 Journal</div>
      <div class="main-nav-item" id="navGallery" onclick="setMainSection('gallery')">🖼 Gallery</div>
      <div class="main-nav-item" id="navKit" onclick="setMainSection('kit')">🎒 Kit</div>
      <div class="main-nav-item" id="navChecklist" onclick="setMainSection('checklist')">✅ Checklist</div>
    </div>

    <div class="section active" id="journalSection">

    <div class="stats" id="statsBox" style="display:none;">
      <div class="stat-box"><div class="stat-value" id="statSessions">0</div><div class="stat-label">Sessions</div></div>
      <div class="stat-box"><div class="stat-value" id="statCatches">0</div><div class="stat-label">Total catches</div></div>
      <div class="stat-box"><div class="stat-value" id="statLocations">0</div><div class="stat-label">Locations</div></div>
    </div>

    <div class="search-box">
      <span class="icon">🔍</span>
      <input type="text" id="searchInput" placeholder="Search by location or species..." oninput="onSearch()">
    </div>
    <div class="search-hint">Matches location, spot, or any species caught in a session</div>

    <div class="tabs">
      <div class="tab active" id="tabRecent" onclick="setView('recent')">Recent</div>
      <div class="tab" id="tabByLocation" onclick="setView('byLocation')">By Location</div>
    </div>

    <div id="emptyState" class="empty-state">
      <div class="big">🐟</div>
      <div class="title serif">No sessions yet</div>
      <div>Log your first trip to start the journal.</div>
    </div>

    <div id="sessionList"></div>

    </div>
    <!-- /journalSection -->

    <div class="section" id="gallerySection">
      <div id="galleryGrid" class="gallery-grid"></div>
      <div id="galleryEmpty" class="empty-state" style="display:none;">
        <div class="big">🖼</div>
        <div class="title serif">No photos yet</div>
        <div>Photos you add to sessions and catches will show up here.</div>
      </div>
    </div>

    <div class="section" id="kitSection">
      <div class="add-kit-row">
        <input type="text" id="kitNameInput" placeholder="Add gear item...">
        <select id="kitCategoryInput">
          <option>Rods & Reels</option>
          <option>Terminal Tackle</option>
          <option>Bait & Groundbait</option>
          <option>Fish Care</option>
          <option>Comfort</option>
          <option>Essentials</option>
          <option>Other</option>
        </select>
        <button onclick="addKitItem()">+</button>
      </div>
      <div id="kitList"></div>
    </div>

    <div class="section" id="checklistSection">
      <div class="checklist-header-row">
        <div class="checklist-progress" id="checklistProgress">0 of 0 packed</div>
        <button class="reset-btn" onclick="resetChecklist()">Reset for next trip</button>
      </div>
      <div class="add-checklist-row">
        <input type="text" id="checklistNameInput" placeholder="Add checklist item...">
        <button onclick="addChecklistItem()">+</button>
      </div>
      <div id="checklistList"></div>
    </div>

  </div>

  <button class="fab" onclick="openSessionForm()">+</button>

  <!-- New/Edit Session Modal -->
  <div class="modal-overlay" id="sessionModalOverlay" onclick="if(event.target===this) closeSessionForm()">
    <div class="modal">
      <div class="modal-header">
        <h2 class="serif" id="sessionModalTitle">New session</h2>
        <button class="close-btn" onclick="closeSessionForm()">✕</button>
      </div>
      <div id="sessionErrorBox"></div>

      <div class="form-section-title">Where & When</div>
      <div class="field">
        <label>Date</label>
        <input type="date" id="sDate">
      </div>
      <div class="field">
        <label>Location *</label>
        <input type="text" id="sLocation" placeholder="e.g. Lough Erne, Kesh shore" oninput="onLocationInput()">
      </div>
      <div class="location-hint" id="locationHint"></div>
      <div class="field">
        <label>Peg / spot</label>
        <input type="text" id="sPeg" placeholder="e.g. Peg 20">
      </div>
      <div class="field">
        <label>GPS coordinates</label>
        <div class="gps-row">
          <input type="text" id="sCoords" placeholder="Not set" readonly>
          <button type="button" class="gps-btn" onclick="captureGPS()">📍 Use my location</button>
        </div>
        <div class="gps-coords" id="gpsStatus"></div>
      </div>
      <div class="field">
        <label>Weather</label>
        <select id="sWeather">
          <option>Sunny</option>
          <option>Overcast</option>
          <option>Rain</option>
          <option>Windy</option>
          <option>Mixed</option>
        </select>
      </div>

      <div class="form-section-title">Tackle Setup</div>
      <div class="row-3">
        <div class="field"><label>Rod</label><input type="text" id="sRod" placeholder="e.g. Feeder rod"></div>
        <div class="field"><label>Reel</label><input type="text" id="sReel"></div>
        <div class="field"><label>Distance</label><input type="text" id="sDistance" placeholder="e.g. 40m"></div>
      </div>
      <div class="row-3">
        <div class="field"><label>Hook</label><input type="text" id="sHook" placeholder="e.g. Size 14"></div>
        <div class="field"><label>Feeder</label><input type="text" id="sFeeder" placeholder="e.g. 30g"></div>
        <div class="field"><label>Hookbait</label><input type="text" id="sHookbait" placeholder="e.g. Corn"></div>
      </div>

      <div class="form-section-title">Observations</div>
      <div class="row-2">
        <div class="field"><label>Fish activity</label><input type="text" id="sFishActivity"></div>
        <div class="field"><label>Bubbles</label><input type="text" id="sBubbles"></div>
      </div>
      <div class="row-2">
        <div class="field"><label>Birds</label><input type="text" id="sBirds"></div>
        <div class="field"><label>Weed</label><input type="text" id="sWeed"></div>
      </div>

      <div class="form-section-title">Session Notes</div>
      <div class="field">
        <label>General notes</label>
        <textarea id="sNotes" rows="3" placeholder="Conditions, plan, general observations..."></textarea>
      </div>
      <div class="row-2">
        <div class="field"><label>What worked</label><textarea id="sWhatWorked" rows="2"></textarea></div>
        <div class="field"><label>What didn't</label><textarea id="sWhatDidnt" rows="2"></textarea></div>
      </div>
      <div class="field">
        <label>Plan for next trip</label>
        <textarea id="sPlanNextTrip" rows="2" placeholder="What would you try differently..."></textarea>
      </div>
      <div class="field">
        <label>Session rating</label>
        <div class="rating-picker" id="ratingPicker"></div>
      </div>

      <div class="form-section-title">Photos</div>
      <div class="field">
        <label>Location photos</label>
        <label class="photo-picker-btn" for="sPhotoInput">📷 Add photo</label>
        <input type="file" id="sPhotoInput" class="photo-input" accept="image/*" multiple onchange="handlePhotoSelect(event, 'session')">
        <div class="photo-strip" id="sPhotoStrip"></div>
      </div>

      <button class="save-btn" id="sessionSaveBtn" onclick="saveSession()">Start session</button>
    </div>
  </div>

  <!-- Session Detail Modal -->
  <div class="modal-overlay" id="detailModalOverlay" onclick="if(event.target===this) closeDetail()">
    <div class="modal">
      <div class="modal-header">
        <h2 class="serif" id="detailLocation">Session</h2>
        <button class="close-btn" onclick="closeDetail()">✕</button>
      </div>
      <div class="detail-top-actions">
        <button class="edit-link-btn" onclick="editSessionFromDetail()">✎ Edit session</button>
      </div>
      <div class="session-detail-meta" id="detailMeta"></div>
      <div id="detailRating"></div>
      <div id="detailTackle"></div>
      <div id="detailObservations"></div>
      <div id="detailNotesWrap"></div>
      <div id="detailWrapup"></div>
      <div id="detailPhotos"></div>
      <button class="add-catch-btn" onclick="openCatchForm()">+ Add a catch to this session</button>
      <div id="catchList"></div>
      <button class="secondary-btn" onclick="deleteSession()">Delete this session</button>
    </div>
  </div>

  <!-- New/Edit Catch Modal -->
  <div class="modal-overlay" id="catchModalOverlay" onclick="if(event.target===this) closeCatchForm()">
    <div class="modal">
      <div class="modal-header">
        <h2 class="serif" id="catchModalTitle">Log a catch</h2>
        <button class="close-btn" onclick="closeCatchForm()">✕</button>
      </div>
      <div id="catchErrorBox"></div>
      <div class="field">
        <label>Species *</label>
        <input type="text" id="cSpecies" placeholder="e.g. Pike, Perch, Brown Trout">
      </div>
      <div class="row-2">
        <div class="field">
          <label>Weight</label>
          <input type="text" id="cWeight" placeholder="e.g. 4lb 2oz">
        </div>
        <div class="field">
          <label>Length</label>
          <input type="text" id="cLength" placeholder="e.g. 58cm">
        </div>
      </div>
      <div class="field">
        <label>Bait / lure</label>
        <input type="text" id="cBait" placeholder="e.g. Spinner, worm, fly">
      </div>
      <div class="field">
        <label>Time</label>
        <input type="time" id="cTime">
      </div>
      <div class="field">
        <label>Notes</label>
        <textarea id="cNotes" rows="2" placeholder="Anything worth remembering..."></textarea>
      </div>
      <div class="field">
        <label>Catch photo</label>
        <label class="photo-picker-btn" for="cPhotoInput">📷 Add photo</label>
        <input type="file" id="cPhotoInput" class="photo-input" accept="image/*" multiple onchange="handlePhotoSelect(event, 'catch')">
        <div class="photo-strip" id="cPhotoStrip"></div>
      </div>
      <button class="save-btn" id="catchSaveBtn" onclick="saveCatch()">Save catch</button>
    </div>
  </div>
`;

document.getElementById('view-journal').innerHTML = JOURNAL_HTML;

const STORAGE_KEY = 'fishing_journal_sessions';
const LEGACY_KEY = 'fishing_log_entries';
const KIT_KEY = 'fishing_kit_items';
const CHECKLIST_KEY = 'fishing_checklist_items';

function loadSessions() {
  const current = Store.load(STORAGE_KEY, null);
  if (current) return current;

  try {
    const legacyEntries = Store.load(LEGACY_KEY, null);
    if (legacyEntries) {
      const groups = {};
      legacyEntries.forEach(e => {
        const key = e.date + '|' + e.location;
        if (!groups[key]) {
          groups[key] = {
            id: uid(), date: e.date, location: e.location, peg: '',
            weather: e.weather || '', notes: '', catches: []
          };
        }
        groups[key].catches.push({
          id: uid(), species: e.species, weight: e.weight, length: e.length,
          bait: e.bait, time: '', notes: e.notes || ''
        });
      });
      const migrated = Object.values(groups);
      if (migrated.length > 0) {
        saveSessions(migrated);
        return migrated;
      }
    }
  } catch (e) { console.error('Migration failed', e); }

  return [];
}

function saveSessions(sessionsToSave) {
  return Store.save(STORAGE_KEY, sessionsToSave);
}

let sessions = loadSessions();
let currentView = 'recent';
let searchQuery = '';
let activeSessionId = null;
let editingSessionId = null;
let editingCatchId = null;
let pendingSessionPhotos = [];
let pendingCatchPhotos = [];
let currentRating = 0;
let pendingCoords = null;

function getFilteredSessions() {
  let list = [...sessions];
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter(s =>
      (s.location || '').toLowerCase().includes(q) ||
      (s.peg || '').toLowerCase().includes(q) ||
      (s.catches || []).some(c => (c.species || '').toLowerCase().includes(q))
    );
  }
  return list.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function setView(view) {
  currentView = view;
  document.getElementById('tabRecent').classList.toggle('active', view === 'recent');
  document.getElementById('tabByLocation').classList.toggle('active', view === 'byLocation');
  render();
}

function onSearch() {
  searchQuery = document.getElementById('searchInput').value;
  render();
}

function setMainSection(section) {
  ['journal', 'gallery', 'kit', 'checklist'].forEach(s => {
    document.getElementById('nav' + s.charAt(0).toUpperCase() + s.slice(1)).classList.toggle('active', s === section);
    document.getElementById(s + 'Section').classList.toggle('active', s === section);
  });
  if (section === 'kit') renderKit();
  if (section === 'checklist') renderChecklist();
  if (section === 'gallery') renderGallery();
}

function starString(rating) {
  if (!rating) return '';
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

function sessionSpeciesChips(session) {
  const species = [...new Set((session.catches || []).map(c => c.species).filter(Boolean))];
  return species.map(s => `<span class="chip">${escapeHtml(s)}</span>`).join('');
}

function renderSessionCard(s) {
  const catchCount = (s.catches || []).length;
  return `
    <div class="session-card" onclick="openDetail('${s.id}')">
      <div class="session-top">
        <span class="session-location serif">${escapeHtml(s.location)}</span>
        <span class="session-date">${formatDate(s.date)}</span>
      </div>
      <div class="session-sub">
        ${s.peg ? escapeHtml(s.peg) + ' · ' : ''}${s.weather ? escapeHtml(s.weather) : ''}
        <span class="catch-count">· ${catchCount} catch${catchCount === 1 ? '' : 'es'}</span>
        ${s.rating ? ` · <span class="stars">${starString(s.rating)}</span>` : ''}
      </div>
      <div class="species-chips">${sessionSpeciesChips(s)}</div>
      ${(s.photos && s.photos.length) ? `<div class="card-photo-strip">${s.photos.slice(0,4).map(p => `<img src="${p.dataUrl}">`).join('')}</div>` : ''}
    </div>
  `;
}

function render() {
  const total = sessions.length;
  document.getElementById('subtitle').textContent = total + (total === 1 ? ' session logged' : ' sessions logged');

  const statsBox = document.getElementById('statsBox');
  if (total > 0) {
    statsBox.style.display = 'grid';
    const totalCatches = sessions.reduce((sum, s) => sum + (s.catches || []).length, 0);
    const locations = new Set(sessions.map(s => s.location).filter(Boolean));
    document.getElementById('statSessions').textContent = total;
    document.getElementById('statCatches').textContent = totalCatches;
    document.getElementById('statLocations').textContent = locations.size;
  } else {
    statsBox.style.display = 'none';
  }

  const filtered = getFilteredSessions();
  const listEl = document.getElementById('sessionList');
  const emptyEl = document.getElementById('emptyState');

  if (filtered.length === 0) {
    emptyEl.style.display = 'block';
    emptyEl.querySelector('.title').textContent = sessions.length === 0 ? 'No sessions yet' : 'No matching sessions';
    listEl.innerHTML = '';
    return;
  }
  emptyEl.style.display = 'none';

  if (currentView === 'recent') {
    listEl.innerHTML = filtered.map(renderSessionCard).join('');
  } else {
    const byLocation = {};
    filtered.forEach(s => {
      const loc = s.location || 'Unknown';
      if (!byLocation[loc]) byLocation[loc] = [];
      byLocation[loc].push(s);
    });
    const locNames = Object.keys(byLocation).sort();
    listEl.innerHTML = locNames.map(loc => `
      <div class="location-group">
        <div class="location-group-header">
          <span class="name serif">${escapeHtml(loc)}</span>
          <span class="count">${byLocation[loc].length} session${byLocation[loc].length === 1 ? '' : 's'}</span>
        </div>
        ${byLocation[loc].map(renderSessionCard).join('')}
      </div>
    `).join('');
  }
}

// ---- Rating picker ----
function renderRatingPicker() {
  const el = document.getElementById('ratingPicker');
  el.innerHTML = [1,2,3,4,5].map(n => `
    <span class="rating-star ${n <= currentRating ? 'filled' : ''}" onclick="setRating(${n})">★</span>
  `).join('');
}
function setRating(n) {
  currentRating = (currentRating === n) ? 0 : n; // click same star again to clear
  renderRatingPicker();
}

// ---- GPS ----
function captureGPS() {
  const statusEl = document.getElementById('gpsStatus');
  if (!navigator.geolocation) {
    statusEl.textContent = 'Geolocation not supported on this device.';
    return;
  }
  statusEl.textContent = 'Getting location...';
  navigator.geolocation.getCurrentPosition(
    pos => {
      pendingCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      document.getElementById('sCoords').value = pendingCoords.lat.toFixed(5) + ', ' + pendingCoords.lng.toFixed(5);
      statusEl.innerHTML = `<a href="https://www.google.com/maps?q=${pendingCoords.lat},${pendingCoords.lng}" target="_blank">Open in Maps</a>`;
    },
    err => {
      statusEl.textContent = 'Could not get location — check location permissions.';
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

// ---- Photo handling ----
function compressImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        let w = img.width, h = img.height;
        if (w > h && w > maxDim) { h = Math.round(h * (maxDim / w)); w = maxDim; }
        else if (h > maxDim) { w = Math.round(w * (maxDim / h)); h = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function handlePhotoSelect(event, type) {
  const files = Array.from(event.target.files || []);
  for (const file of files) {
    try {
      const dataUrl = await compressImage(file, 900, 0.72);
      const photo = { id: uid(), dataUrl: dataUrl };
      if (type === 'session') pendingSessionPhotos.push(photo);
      else pendingCatchPhotos.push(photo);
    } catch (e) {
      console.error('Could not process photo', e);
    }
  }
  renderPhotoStrip(type);
  event.target.value = '';
}

function renderPhotoStrip(type) {
  const list = type === 'session' ? pendingSessionPhotos : pendingCatchPhotos;
  const stripEl = document.getElementById(type === 'session' ? 'sPhotoStrip' : 'cPhotoStrip');
  stripEl.innerHTML = list.map((p, i) => `
    <div class="photo-thumb">
      <img src="${p.dataUrl}">
      <button class="rm" onclick="removePendingPhoto('${type}', ${i})">✕</button>
    </div>
  `).join('');
}

function removePendingPhoto(type, index) {
  if (type === 'session') pendingSessionPhotos.splice(index, 1);
  else pendingCatchPhotos.splice(index, 1);
  renderPhotoStrip(type);
}

// ---- Location history hint ----
function onLocationInput() {
  const query = document.getElementById('sLocation').value.trim().toLowerCase();
  const hintEl = document.getElementById('locationHint');
  if (!query) { hintEl.classList.remove('show'); return; }

  const matches = sessions
    .filter(s => (s.location || '').trim().toLowerCase() === query && s.id !== editingSessionId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  if (matches.length === 0) { hintEl.classList.remove('show'); return; }

  const last = matches[0];
  const species = [...new Set((last.catches || []).map(c => c.species).filter(Boolean))];
  hintEl.innerHTML = `
    <div class="hint-title">📍 You've fished here before — last time: ${formatDate(last.date)}</div>
    ${last.peg ? `Spot: ${escapeHtml(last.peg)}. ` : ''}${last.weather ? `Weather: ${escapeHtml(last.weather)}.` : ''}
    ${last.planNextTrip ? `<div style="margin-top:5px;"><strong>Plan from last time:</strong> "${escapeHtml(last.planNextTrip)}"</div>` : ''}
    ${last.notes ? `<div style="margin-top:5px;">"${escapeHtml(last.notes)}"</div>` : ''}
    ${species.length ? `<div class="hint-chips">${species.map(sp => `<span class="chip">${escapeHtml(sp)}</span>`).join('')}</div>` : ''}
    <div style="margin-top:5px; color:#7FA39A;">${matches.length} session${matches.length === 1 ? '' : 's'} logged here total</div>
  `;
  hintEl.classList.add('show');
}

// ---- New/Edit Session ----
function openSessionForm() {
  editingSessionId = null;
  document.getElementById('sessionModalTitle').textContent = 'New session';
  document.getElementById('sessionSaveBtn').textContent = 'Start session';
  document.getElementById('sDate').value = new Date().toISOString().slice(0, 10);
  document.getElementById('sLocation').value = '';
  document.getElementById('sPeg').value = '';
  document.getElementById('sWeather').value = 'Sunny';
  document.getElementById('sNotes').value = '';
  document.getElementById('sRod').value = '';
  document.getElementById('sReel').value = '';
  document.getElementById('sDistance').value = '';
  document.getElementById('sHook').value = '';
  document.getElementById('sFeeder').value = '';
  document.getElementById('sHookbait').value = '';
  document.getElementById('sFishActivity').value = '';
  document.getElementById('sBubbles').value = '';
  document.getElementById('sBirds').value = '';
  document.getElementById('sWeed').value = '';
  document.getElementById('sWhatWorked').value = '';
  document.getElementById('sWhatDidnt').value = '';
  document.getElementById('sPlanNextTrip').value = '';
  document.getElementById('sCoords').value = '';
  document.getElementById('gpsStatus').innerHTML = '';
  document.getElementById('sessionErrorBox').innerHTML = '';
  document.getElementById('locationHint').classList.remove('show');
  pendingCoords = null;
  currentRating = 0;
  renderRatingPicker();
  pendingSessionPhotos = [];
  renderPhotoStrip('session');
  document.getElementById('sessionModalOverlay').classList.add('open');
}

function editSessionFromDetail() {
  const s = sessions.find(x => x.id === activeSessionId);
  if (!s) return;
  editingSessionId = s.id;
  document.getElementById('sessionModalTitle').textContent = 'Edit session';
  document.getElementById('sessionSaveBtn').textContent = 'Save changes';
  document.getElementById('sDate').value = s.date || '';
  document.getElementById('sLocation').value = s.location || '';
  document.getElementById('sPeg').value = s.peg || '';
  document.getElementById('sWeather').value = s.weather || 'Sunny';
  document.getElementById('sNotes').value = s.notes || '';
  document.getElementById('sRod').value = s.rod || '';
  document.getElementById('sReel').value = s.reel || '';
  document.getElementById('sDistance').value = s.distance || '';
  document.getElementById('sHook').value = s.hook || '';
  document.getElementById('sFeeder').value = s.feeder || '';
  document.getElementById('sHookbait').value = s.hookbait || '';
  document.getElementById('sFishActivity').value = s.fishActivity || '';
  document.getElementById('sBubbles').value = s.bubbles || '';
  document.getElementById('sBirds').value = s.birds || '';
  document.getElementById('sWeed').value = s.weed || '';
  document.getElementById('sWhatWorked').value = s.whatWorked || '';
  document.getElementById('sWhatDidnt').value = s.whatDidnt || '';
  document.getElementById('sPlanNextTrip').value = s.planNextTrip || '';
  document.getElementById('sessionErrorBox').innerHTML = '';
  document.getElementById('locationHint').classList.remove('show');

  if (s.lat != null && s.lng != null) {
    pendingCoords = { lat: s.lat, lng: s.lng };
    document.getElementById('sCoords').value = s.lat.toFixed(5) + ', ' + s.lng.toFixed(5);
    document.getElementById('gpsStatus').innerHTML = `<a href="https://www.google.com/maps?q=${s.lat},${s.lng}" target="_blank">Open in Maps</a>`;
  } else {
    pendingCoords = null;
    document.getElementById('sCoords').value = '';
    document.getElementById('gpsStatus').innerHTML = '';
  }

  currentRating = s.rating || 0;
  renderRatingPicker();
  pendingSessionPhotos = (s.photos || []).slice();
  renderPhotoStrip('session');

  closeDetail(false);
  document.getElementById('sessionModalOverlay').classList.add('open');
}

function closeSessionForm() {
  document.getElementById('sessionModalOverlay').classList.remove('open');
}

function saveSession() {
  const location = document.getElementById('sLocation').value.trim();
  if (!location) {
    document.getElementById('sessionErrorBox').innerHTML =
      '<div class="error-box">Location is needed to start a session.</div>';
    return;
  }

  const fields = {
    date: document.getElementById('sDate').value,
    location: location,
    peg: document.getElementById('sPeg').value.trim(),
    weather: document.getElementById('sWeather').value,
    notes: document.getElementById('sNotes').value.trim(),
    rod: document.getElementById('sRod').value.trim(),
    reel: document.getElementById('sReel').value.trim(),
    distance: document.getElementById('sDistance').value.trim(),
    hook: document.getElementById('sHook').value.trim(),
    feeder: document.getElementById('sFeeder').value.trim(),
    hookbait: document.getElementById('sHookbait').value.trim(),
    fishActivity: document.getElementById('sFishActivity').value.trim(),
    bubbles: document.getElementById('sBubbles').value.trim(),
    birds: document.getElementById('sBirds').value.trim(),
    weed: document.getElementById('sWeed').value.trim(),
    whatWorked: document.getElementById('sWhatWorked').value.trim(),
    whatDidnt: document.getElementById('sWhatDidnt').value.trim(),
    planNextTrip: document.getElementById('sPlanNextTrip').value.trim(),
    rating: currentRating,
    lat: pendingCoords ? pendingCoords.lat : null,
    lng: pendingCoords ? pendingCoords.lng : null,
    photos: pendingSessionPhotos.slice()
  };

  if (editingSessionId) {
    const s = sessions.find(x => x.id === editingSessionId);
    if (s) Object.assign(s, fields);
  } else {
    sessions.unshift({ id: uid(), catches: [], ...fields });
  }

  saveSessions(sessions);
  const savedId = editingSessionId || sessions[0].id;
  closeSessionForm();
  render();
  openDetail(savedId);
}

// ---- Session Detail ----
function openDetail(id) {
  activeSessionId = id;
  const s = sessions.find(x => x.id === id);
  if (!s) return;

  document.getElementById('detailLocation').textContent = s.location;
  document.getElementById('detailMeta').innerHTML = `
    <div>📅 ${formatDate(s.date)}</div>
    ${s.peg ? `<div>📍 ${escapeHtml(s.peg)}</div>` : ''}
    ${s.weather ? `<div>☁ ${escapeHtml(s.weather)}</div>` : ''}
    ${(s.lat != null) ? `<div><a href="https://www.google.com/maps?q=${s.lat},${s.lng}" target="_blank" style="color:#8FBFA0;">🗺 Map</a></div>` : ''}
  `;

  document.getElementById('detailRating').innerHTML = s.rating
    ? `<div class="detail-section"><span class="stars" style="font-size:16px;">${starString(s.rating)}</span></div>` : '';

  const tackleFields = [
    ['Rod', s.rod], ['Reel', s.reel], ['Distance', s.distance],
    ['Hook', s.hook], ['Feeder', s.feeder], ['Hookbait', s.hookbait]
  ].filter(([_, v]) => v);
  document.getElementById('detailTackle').innerHTML = tackleFields.length ? `
    <div class="detail-section">
      <div class="detail-section-title">Tackle setup</div>
      <div class="detail-kv">${tackleFields.map(([k, v]) => `<div><strong>${k}:</strong> ${escapeHtml(v)}</div>`).join('')}</div>
    </div>
  ` : '';

  const obsFields = [
    ['Fish activity', s.fishActivity], ['Bubbles', s.bubbles], ['Birds', s.birds], ['Weed', s.weed]
  ].filter(([_, v]) => v);
  document.getElementById('detailObservations').innerHTML = obsFields.length ? `
    <div class="detail-section">
      <div class="detail-section-title">Observations</div>
      <div class="detail-kv">${obsFields.map(([k, v]) => `<div><strong>${k}:</strong> ${escapeHtml(v)}</div>`).join('')}</div>
    </div>
  ` : '';

  document.getElementById('detailNotesWrap').innerHTML = s.notes
    ? `<div class="session-notes">📝 ${escapeHtml(s.notes)}</div>` : '';

  const wrapupFields = [
    ['What worked', s.whatWorked], ["What didn't", s.whatDidnt], ['Plan for next trip', s.planNextTrip]
  ].filter(([_, v]) => v);
  document.getElementById('detailWrapup').innerHTML = wrapupFields.length ? `
    <div class="detail-section">
      <div class="detail-section-title">Wrap-up</div>
      ${wrapupFields.map(([k, v]) => `<div style="margin-bottom:6px; font-size:13px;"><strong>${k}:</strong> ${escapeHtml(v)}</div>`).join('')}
    </div>
  ` : '';

  document.getElementById('detailPhotos').innerHTML = (s.photos && s.photos.length)
    ? `<div class="detail-photo-strip">${s.photos.map(p => `<img src="${p.dataUrl}">`).join('')}</div>` : '';

  renderCatchList(s);
  document.getElementById('detailModalOverlay').classList.add('open');
}

function renderCatchList(s) {
  const catchListEl = document.getElementById('catchList');
  if (!s.catches || s.catches.length === 0) {
    catchListEl.innerHTML = '<div style="text-align:center; color:#7FA39A; font-size:13px; padding:12px 0;">No catches logged yet for this session.</div>';
    return;
  }
  catchListEl.innerHTML = s.catches.map(c => `
    <div class="catch-item">
      <div class="catch-actions">
        <button class="edit-icon" onclick="editCatch('${c.id}')">✎</button>
        <button class="del" onclick="deleteCatch('${c.id}')">🗑</button>
      </div>
      <div class="species serif">${escapeHtml(c.species)}</div>
      <div class="meta-row">
        ${c.weight ? `<span>⚖ ${escapeHtml(c.weight)}</span>` : ''}
        ${c.length ? `<span>📏 ${escapeHtml(c.length)}</span>` : ''}
        ${c.bait ? `<span>🐟 ${escapeHtml(c.bait)}</span>` : ''}
        ${c.time ? `<span>🕐 ${escapeHtml(c.time)}</span>` : ''}
      </div>
      ${c.notes ? `<div style="margin-top:6px; font-size:12.5px; color:#C7D8D3;">${escapeHtml(c.notes)}</div>` : ''}
      ${(c.photos && c.photos.length) ? `<div class="catch-photo-strip">${c.photos.map(p => `<img src="${p.dataUrl}">`).join('')}</div>` : ''}
    </div>
  `).join('');
}

function closeDetail(rerender) {
  document.getElementById('detailModalOverlay').classList.remove('open');
  if (rerender !== false) {
    activeSessionId = null;
    render();
  }
}

function deleteSession() {
  sessions = sessions.filter(s => s.id !== activeSessionId);
  saveSessions(sessions);
  closeDetail();
}

// ---- New/Edit Catch ----
function openCatchForm() {
  editingCatchId = null;
  document.getElementById('catchModalTitle').textContent = 'Log a catch';
  document.getElementById('catchSaveBtn').textContent = 'Save catch';
  document.getElementById('cSpecies').value = '';
  document.getElementById('cWeight').value = '';
  document.getElementById('cLength').value = '';
  document.getElementById('cBait').value = '';
  document.getElementById('cTime').value = '';
  document.getElementById('cNotes').value = '';
  document.getElementById('catchErrorBox').innerHTML = '';
  pendingCatchPhotos = [];
  renderPhotoStrip('catch');
  document.getElementById('catchModalOverlay').classList.add('open');
}

function editCatch(catchId) {
  const s = sessions.find(x => x.id === activeSessionId);
  if (!s) return;
  const c = (s.catches || []).find(x => x.id === catchId);
  if (!c) return;
  editingCatchId = catchId;
  document.getElementById('catchModalTitle').textContent = 'Edit catch';
  document.getElementById('catchSaveBtn').textContent = 'Save changes';
  document.getElementById('cSpecies').value = c.species || '';
  document.getElementById('cWeight').value = c.weight || '';
  document.getElementById('cLength').value = c.length || '';
  document.getElementById('cBait').value = c.bait || '';
  document.getElementById('cTime').value = c.time || '';
  document.getElementById('cNotes').value = c.notes || '';
  document.getElementById('catchErrorBox').innerHTML = '';
  pendingCatchPhotos = (c.photos || []).slice();
  renderPhotoStrip('catch');
  document.getElementById('catchModalOverlay').classList.add('open');
}

function closeCatchForm() {
  document.getElementById('catchModalOverlay').classList.remove('open');
}

function saveCatch() {
  const species = document.getElementById('cSpecies').value.trim();
  if (!species) {
    document.getElementById('catchErrorBox').innerHTML =
      '<div class="error-box">Species is needed to log a catch.</div>';
    return;
  }
  const s = sessions.find(x => x.id === activeSessionId);
  if (!s) return;
  if (!s.catches) s.catches = [];

  const fields = {
    species: species,
    weight: document.getElementById('cWeight').value.trim(),
    length: document.getElementById('cLength').value.trim(),
    bait: document.getElementById('cBait').value.trim(),
    time: document.getElementById('cTime').value,
    notes: document.getElementById('cNotes').value.trim(),
    photos: pendingCatchPhotos.slice()
  };

  if (editingCatchId) {
    const c = s.catches.find(x => x.id === editingCatchId);
    if (c) Object.assign(c, fields);
  } else {
    s.catches.push({ id: uid(), ...fields });
  }

  saveSessions(sessions);
  closeCatchForm();
  renderCatchList(s);
}

function deleteCatch(catchId) {
  const s = sessions.find(x => x.id === activeSessionId);
  if (!s) return;
  s.catches = s.catches.filter(c => c.id !== catchId);
  saveSessions(sessions);
  renderCatchList(s);
}

// ---- Gallery ----
function renderGallery() {
  const allPhotos = [];
  sessions.forEach(s => {
    (s.photos || []).forEach(p => allPhotos.push({ ...p, sessionId: s.id }));
    (s.catches || []).forEach(c => (c.photos || []).forEach(p => allPhotos.push({ ...p, sessionId: s.id })));
  });
  const gridEl = document.getElementById('galleryGrid');
  const emptyEl = document.getElementById('galleryEmpty');
  if (allPhotos.length === 0) {
    gridEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';
  gridEl.innerHTML = allPhotos.map(p => `<img src="${p.dataUrl}" onclick="setMainSection('journal'); openDetail('${p.sessionId}')">`).join('');
}

// ---- Backup / Restore ----
function exportEntries() {
  if (sessions.length === 0) {
    showToast('No sessions to export yet');
    return;
  }
  const dataStr = JSON.stringify(sessions, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `fishing-journal-backup-${dateStamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup saved to your files');
}

function importEntries(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      const existingIds = new Set(sessions.map(s => s.id));
      let addedCount = 0;
      imported.forEach(s => {
        if (s && s.id && !existingIds.has(s.id)) {
          sessions.push(s);
          existingIds.add(s.id);
          addedCount++;
        }
      });
      saveSessions(sessions);
      render();
      showToast(addedCount > 0 ? `Imported ${addedCount} session${addedCount === 1 ? '' : 's'}` : 'Nothing new to import');
    } catch (err) {
      showToast('Could not read that backup file');
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ---- Kit ----
const DEFAULT_CHECKLIST = [
  ['Rods & Reels', 'Feeder rod'], ['Rods & Reels', 'Spare rod'], ['Rods & Reels', 'Reel'], ['Rods & Reels', 'Spare spool'],
  ['Terminal Tackle', '30g feeders'], ['Terminal Tackle', 'Hooks (10,12,14)'], ['Terminal Tackle', 'Hooklengths'],
  ['Terminal Tackle', 'Swivels'], ['Terminal Tackle', 'Beads'], ['Terminal Tackle', 'Split shot'],
  ['Terminal Tackle', 'Scissors'], ['Terminal Tackle', 'Disgorger'], ['Terminal Tackle', 'Baiting needle'],
  ['Bait & Groundbait', 'Groundbait'], ['Bait & Groundbait', 'Sweetcorn'], ['Bait & Groundbait', 'Worms'],
  ['Bait & Groundbait', 'Maggots'], ['Bait & Groundbait', 'Casters'], ['Bait & Groundbait', 'Hemp'],
  ['Bait & Groundbait', 'Mixing bowl'], ['Bait & Groundbait', 'Water for mixing'],
  ['Fish Care', 'Landing net'], ['Fish Care', 'Keepnet'], ['Fish Care', 'Unhooking mat'],
  ['Fish Care', 'Forceps'], ['Fish Care', 'Weigh sling'], ['Fish Care', 'Scales'],
  ['Comfort', 'Chair'], ['Comfort', 'Hat'], ['Comfort', 'Waterproofs'], ['Comfort', 'Sunscreen'],
  ['Comfort', 'Polarised sunglasses'], ['Comfort', 'Food'], ['Comfort', 'Drinks'],
  ['Essentials', 'Fishing licence'], ['Essentials', 'Phone'], ['Essentials', 'Power bank'],
  ['Essentials', 'Head torch'], ['Essentials', 'First aid kit'], ['Essentials', 'Bin bag']
];

function loadKit() {
  return Store.load(KIT_KEY, []);
}
function saveKit(kit) {
  Store.save(KIT_KEY, kit);
}

function loadChecklist() {
  const current = Store.load(CHECKLIST_KEY, null);
  if (current) return current;
  const seeded = DEFAULT_CHECKLIST.map(([category, label]) => ({ id: uid(), category, label, checked: false }));
  saveChecklist(seeded);
  return seeded;
}
function saveChecklist(list) {
  Store.save(CHECKLIST_KEY, list);
}

let kitItems = loadKit();
let checklistItems = loadChecklist();

function addKitItem() {
  const nameInput = document.getElementById('kitNameInput');
  const name = nameInput.value.trim();
  if (!name) return;
  kitItems.push({
    id: uid(), name: name,
    category: document.getElementById('kitCategoryInput').value,
    owned: false
  });
  saveKit(kitItems);
  nameInput.value = '';
  renderKit();
}
function toggleKitOwned(id) {
  const item = kitItems.find(k => k.id === id);
  if (item) item.owned = !item.owned;
  saveKit(kitItems);
  renderKit();
}
function deleteKitItem(id) {
  kitItems = kitItems.filter(k => k.id !== id);
  saveKit(kitItems);
  renderKit();
}
function renderKit() {
  const listEl = document.getElementById('kitList');
  if (kitItems.length === 0) {
    listEl.innerHTML = '<div style="text-align:center; color:#7FA39A; font-size:13px; padding:20px 0;">No gear added yet. Add what you own or still need above.</div>';
    return;
  }
  const categories = [...new Set(kitItems.map(k => k.category))];
  listEl.innerHTML = categories.map(cat => `
    <div class="kit-category">
      <div class="kit-category-title serif">${escapeHtml(cat)}</div>
      ${kitItems.filter(k => k.category === cat).map(k => `
        <div class="kit-item">
          <span class="kit-name ${k.owned ? '' : 'need'}">${escapeHtml(k.name)}</span>
          <button class="kit-toggle ${k.owned ? 'owned' : 'need-buy'}" onclick="toggleKitOwned('${k.id}')">${k.owned ? '✓ Owned' : 'Need to buy'}</button>
          <button class="kit-del" onclick="deleteKitItem('${k.id}')">🗑</button>
        </div>
      `).join('')}
    </div>
  `).join('');
}

// ---- Checklist ----
function addChecklistItem() {
  const nameInput = document.getElementById('checklistNameInput');
  const label = nameInput.value.trim();
  if (!label) return;
  checklistItems.push({ id: uid(), category: 'Other', label: label, checked: false });
  saveChecklist(checklistItems);
  nameInput.value = '';
  renderChecklist();
}
function toggleChecklistItem(id) {
  const item = checklistItems.find(c => c.id === id);
  if (item) item.checked = !item.checked;
  saveChecklist(checklistItems);
  renderChecklist();
}
function deleteChecklistItem(id) {
  checklistItems = checklistItems.filter(c => c.id !== id);
  saveChecklist(checklistItems);
  renderChecklist();
}
function resetChecklist() {
  checklistItems.forEach(c => c.checked = false);
  saveChecklist(checklistItems);
  renderChecklist();
  showToast('Checklist reset for your next trip');
}
function renderChecklist() {
  const total = checklistItems.length;
  const checked = checklistItems.filter(c => c.checked).length;
  document.getElementById('checklistProgress').textContent = `${checked} of ${total} packed`;

  const listEl = document.getElementById('checklistList');
  if (total === 0) {
    listEl.innerHTML = '<div style="text-align:center; color:#7FA39A; font-size:13px; padding:20px 0;">No checklist items yet.</div>';
    return;
  }
  const categories = [...new Set(checklistItems.map(c => c.category))];
  listEl.innerHTML = categories.map(cat => `
    <div class="checklist-category">
      <div class="checklist-category-title serif">${escapeHtml(cat)}</div>
      ${checklistItems.filter(c => c.category === cat).map(c => `
        <div class="checklist-item ${c.checked ? 'checked' : ''}" onclick="toggleChecklistItem('${c.id}')">
          <div class="box">${c.checked ? '✓' : ''}</div>
          <span class="label">${escapeHtml(c.label)}</span>
          <button class="checklist-del" onclick="event.stopPropagation(); deleteChecklistItem('${c.id}')">🗑</button>
        </div>
      `).join('')}
    </div>
  `).join('');
}

render();

Modules.register('journal', { render });
