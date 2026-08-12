// Shopping List — active/bought.

const SHOPPING_HTML = `
  <div class="module-header module-header--tight">
    <button class="back-btn" onclick="goHome()">←</button>
    <div class="display" style="font-size:19px; font-weight:600;">Shopping List</div>
  </div>
  <div class="list-add-row">
    <input type="text" id="shoppingInput" class="list-input" placeholder="Add an item...">
    <button class="list-add-btn" onclick="addShoppingItem()">+</button>
  </div>
  <div id="shoppingActiveSection"></div>
  <div id="shoppingBoughtSection" style="margin-top:20px;"></div>
`;

document.getElementById('view-shopping').innerHTML = SHOPPING_HTML;

const SHOPPING_KEY = 'personal_os_shopping';

function loadShopping() {
  return Store.load(SHOPPING_KEY, []);
}
function saveShopping(list) {
  Store.save(SHOPPING_KEY, list);
}
let shoppingItems = loadShopping();

function addShoppingItem() {
  const input = document.getElementById('shoppingInput');
  const name = input.value.trim();
  if (!name) return;
  shoppingItems.unshift({ id: uid(), name: name, bought: false });
  saveShopping(shoppingItems);
  input.value = '';
  renderShopping();
}
function toggleShoppingItem(id) {
  const item = shoppingItems.find(i => i.id === id);
  if (item) item.bought = !item.bought;
  saveShopping(shoppingItems);
  renderShopping();
}
function deleteShoppingItem(id) {
  shoppingItems = shoppingItems.filter(i => i.id !== id);
  saveShopping(shoppingItems);
  renderShopping();
}
function shoppingCardHtml(i) {
  return `
    <div class="list-card ${i.bought ? 'done' : ''}">
      <div class="list-checkbox ${i.bought ? 'checked' : ''}" onclick="toggleShoppingItem('${i.id}')">${i.bought ? '✓' : ''}</div>
      <div class="list-title ${i.bought ? 'done' : ''}">${escapeHtml(i.name)}</div>
      <button class="list-delete" onclick="deleteShoppingItem('${i.id}')">🗑</button>
    </div>
  `;
}
function renderShopping() {
  const active = shoppingItems.filter(i => !i.bought);
  const bought = shoppingItems.filter(i => i.bought);

  const activeEl = document.getElementById('shoppingActiveSection');
  activeEl.innerHTML = active.length === 0
    ? '<div class="list-empty">List is empty. Add something above.</div>'
    : active.map(shoppingCardHtml).join('');

  const boughtEl = document.getElementById('shoppingBoughtSection');
  boughtEl.innerHTML = bought.length === 0 ? '' :
    `<div class="list-section-label">Bought (${bought.length})</div>` + bought.map(shoppingCardHtml).join('');
}

Modules.register('shopping', { render: renderShopping });
