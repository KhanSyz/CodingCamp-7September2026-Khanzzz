/* =============================================
   Life Dashboard — app.js
   Challenges:
     ✅ Light / Dark mode
     ✅ Custom name in greeting
     ✅ Change Pomodoro time
   ============================================= */

'use strict';

/* ══════════════════════════════════════════════
   STORAGE DB — centralised localStorage wrapper
   All reads/writes go through this module so the
   database panel always stays in sync.
   ══════════════════════════════════════════════ */
const StorageDB = (() => {
  const KEYS = {
    todos:     'todos',
    links:     'quickLinks',
    userName:  'userName',
    theme:     'theme',
    pomodoro:  'pomodoroMinutes',
  };

  function get(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    renderStoragePanel();           // keep viewer in sync
  }

  function remove(key) {
    localStorage.removeItem(key);
    renderStoragePanel();
  }

  function getString(key)        { return localStorage.getItem(key) || ''; }
  function setString(key, value) {
    localStorage.setItem(key, value);
    renderStoragePanel();
  }
  function removeString(key) {
    localStorage.removeItem(key);
    renderStoragePanel();
  }

  return { KEYS, get, set, remove, getString, setString, removeString };
})();


/* ══════════════════════════════════════════════
   1. CLOCK, DATE & GREETING
   ══════════════════════════════════════════════ */
const elDate     = document.getElementById('current-date');
const elTime     = document.getElementById('current-time');
const elGreeting = document.getElementById('greeting-text');

function getGreeting(hour) {
  if (hour <  12) return 'Good morning';
  if (hour <  17) return 'Good afternoon';
  if (hour <  21) return 'Good evening';
  return 'Good night';
}

function updateClock() {
  const now  = new Date();
  const h    = now.getHours();
  const mm   = String(now.getMinutes()).padStart(2, '0');
  const ss   = String(now.getSeconds()).padStart(2, '0');
  const hh   = String(h).padStart(2, '0');
  const name = StorageDB.getString(StorageDB.KEYS.userName);

  elTime.textContent     = `${hh}:${mm}:${ss}`;
  elGreeting.textContent = name
    ? `${getGreeting(h)}, ${name}!`
    : `${getGreeting(h)}!`;
  elDate.textContent     = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

updateClock();
setInterval(updateClock, 1000);


/* ══════════════════════════════════════════════
   2. CUSTOM NAME
   ══════════════════════════════════════════════ */
const nameDisplay    = document.getElementById('name-display');
const editNameBtn    = document.getElementById('edit-name-btn');
const nameInputRow   = document.getElementById('name-input-row');
const nameInput      = document.getElementById('name-input');
const saveNameBtn    = document.getElementById('save-name-btn');
const cancelNameBtn  = document.getElementById('cancel-name-btn');

function renderName() {
  const name = StorageDB.getString(StorageDB.KEYS.userName);
  nameDisplay.textContent = name ? `👤 ${name}` : '';
}

renderName();

editNameBtn.addEventListener('click', () => {
  nameInputRow.classList.toggle('hidden');
  nameInput.value = StorageDB.getString(StorageDB.KEYS.userName);
  if (!nameInputRow.classList.contains('hidden')) nameInput.focus();
});

cancelNameBtn.addEventListener('click', () => {
  nameInputRow.classList.add('hidden');
});

function saveName() {
  const val = nameInput.value.trim();
  if (val) StorageDB.setString(StorageDB.KEYS.userName, val);
  else     StorageDB.removeString(StorageDB.KEYS.userName);
  renderName();
  nameInputRow.classList.add('hidden');
  updateClock();
}

saveNameBtn.addEventListener('click', saveName);
nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter')  saveName();
  if (e.key === 'Escape') cancelNameBtn.click();
});


/* ══════════════════════════════════════════════
   3. THEME TOGGLE
   ══════════════════════════════════════════════ */
const themeToggle = document.getElementById('theme-toggle');
const themeIcon   = themeToggle.querySelector('.theme-icon');
const htmlEl      = document.documentElement;

function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Restore saved preference
applyTheme(StorageDB.getString(StorageDB.KEYS.theme) || 'light');

themeToggle.addEventListener('click', () => {
  const next = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  StorageDB.setString(StorageDB.KEYS.theme, next);
});


/* ══════════════════════════════════════════════
   4. FOCUS TIMER (Pomodoro)
   ══════════════════════════════════════════════ */
const timerDisplay  = document.getElementById('timer-display');
const timerStatusEl = document.getElementById('timer-status');
const timerStart    = document.getElementById('timer-start');
const timerStop     = document.getElementById('timer-stop');
const timerReset    = document.getElementById('timer-reset');
const pomodoroInput = document.getElementById('pomodoro-minutes');
const pomodoroSet   = document.getElementById('pomodoro-set');

// Restore saved pomodoro duration
const savedMins    = parseInt(StorageDB.getString(StorageDB.KEYS.pomodoro), 10) || 25;
pomodoroInput.value = savedMins;

let timerDuration  = savedMins * 60;
let timerRemaining = timerDuration;
let timerInterval  = null;
let timerRunning   = false;

function fmtTime(sec) {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function setTimerStatus(text) { timerStatusEl.textContent = text; }

function renderTimer() { timerDisplay.textContent = fmtTime(timerRemaining); }

function timerTick() {
  if (timerRemaining <= 0) {
    clearInterval(timerInterval);
    timerRunning = false;
    timerDisplay.textContent = '00:00';
    timerDisplay.classList.add('timer-done');
    setTimerStatus('Session complete! 🎉');
    if (Notification.permission === 'granted') {
      new Notification('⏱ Focus session complete!', { body: 'Time to take a break.' });
    } else {
      alert('⏱ Focus session complete! Time to take a break.');
    }
    return;
  }
  timerRemaining--;
  renderTimer();

  // Update status label every minute
  const minsLeft = Math.ceil(timerRemaining / 60);
  setTimerStatus(minsLeft === 1 ? '1 minute left' : `${minsLeft} minutes left`);
}

timerStart.addEventListener('click', () => {
  if (timerRunning) return;
  if (timerRemaining === 0) return;
  timerDisplay.classList.remove('timer-done');
  timerRunning = true;
  setTimerStatus('Focusing…');
  if (Notification.permission === 'default') Notification.requestPermission();
  timerInterval = setInterval(timerTick, 1000);
});

timerStop.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  setTimerStatus('Paused');
});

timerReset.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  timerRemaining = timerDuration;
  timerDisplay.classList.remove('timer-done');
  renderTimer();
  setTimerStatus('Ready');
});

pomodoroSet.addEventListener('click', () => {
  const mins = parseInt(pomodoroInput.value, 10);
  if (!mins || mins < 1 || mins > 120) return;
  clearInterval(timerInterval);
  timerRunning   = false;
  timerDuration  = mins * 60;
  timerRemaining = timerDuration;
  timerDisplay.classList.remove('timer-done');
  renderTimer();
  setTimerStatus('Ready');
  StorageDB.setString(StorageDB.KEYS.pomodoro, String(mins)); // persist
});

pomodoroInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') pomodoroSet.click();
});

renderTimer();
setTimerStatus('Ready');


/* ══════════════════════════════════════════════
   5. TO-DO LIST
   ══════════════════════════════════════════════ */
const todoInput  = document.getElementById('todo-input');
const todoAddBtn = document.getElementById('todo-add-btn');
const todoListEl = document.getElementById('todo-list');
const todoEmpty  = document.getElementById('todo-empty');
const todoCount  = document.getElementById('todo-count');

let todos = StorageDB.get(StorageDB.KEYS.todos) || [];

function saveTodos() { StorageDB.set(StorageDB.KEYS.todos, todos); }

function renderTodos() {
  todoListEl.innerHTML = '';

  const pending = todos.filter(t => !t.done).length;
  todoCount.textContent = `${pending} left`;
  todoEmpty.classList.toggle('hidden', todos.length > 0);

  todos.forEach(todo => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.dataset.id = todo.id;

    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox"
             ${todo.done ? 'checked' : ''}
             aria-label="Mark as done" />
      <span class="todo-text">${escapeHtml(todo.text)}</span>
      <div class="todo-actions">
        <button class="todo-action-btn edit-btn"   title="Edit task">✏️</button>
        <button class="todo-action-btn delete-btn" title="Delete task">🗑️</button>
      </div>
    `;

    li.querySelector('.todo-checkbox').addEventListener('change', () => {
      const t = todos.find(t => t.id === todo.id);
      if (t) { t.done = !t.done; t.updatedAt = Date.now(); }
      saveTodos();
      renderTodos();
    });

    li.querySelector('.edit-btn').addEventListener('click', () => startEdit(li, todo));

    li.querySelector('.delete-btn').addEventListener('click', () => {
      todos = todos.filter(t => t.id !== todo.id);
      saveTodos();
      renderTodos();
    });

    todoListEl.appendChild(li);
  });
}

function startEdit(li, todo) {
  const span   = li.querySelector('.todo-text');
  const actions = li.querySelector('.todo-actions');

  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'todo-edit-input';
  editInput.value     = todo.text;
  editInput.maxLength = 100;

  span.replaceWith(editInput);
  actions.classList.add('hidden');
  editInput.focus();
  editInput.select();

  function commitEdit() {
    const val = editInput.value.trim();
    if (val && val !== todo.text) {
      const t = todos.find(t => t.id === todo.id);
      if (t) { t.text = val; t.updatedAt = Date.now(); }
      saveTodos();
    }
    renderTodos();
  }

  editInput.addEventListener('blur', commitEdit);
  editInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  editInput.blur();
    if (e.key === 'Escape') renderTodos();
  });
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  todos.push({ id: Date.now(), text, done: false, createdAt: Date.now() });
  saveTodos();
  todoInput.value = '';
  renderTodos();
}

todoAddBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

renderTodos();


/* ══════════════════════════════════════════════
   6. QUICK LINKS
   ══════════════════════════════════════════════ */
const linkNameInput = document.getElementById('link-name-input');
const linkUrlInput  = document.getElementById('link-url-input');
const linkAddBtn    = document.getElementById('link-add-btn');
const linksGrid     = document.getElementById('links-grid');
const linksEmpty    = document.getElementById('links-empty');

let links = StorageDB.get(StorageDB.KEYS.links) || [];

function saveLinks() { StorageDB.set(StorageDB.KEYS.links, links); }

function renderLinks() {
  linksGrid.innerHTML = '';
  linksEmpty.classList.toggle('hidden', links.length > 0);

  links.forEach(link => {
    const item = document.createElement('div');
    item.className = 'link-item';

    const faviconUrl =
      `https://www.google.com/s2/favicons?sz=16&domain=${encodeURIComponent(link.url)}`;

    item.innerHTML = `
      <img class="link-favicon" src="${faviconUrl}" alt=""
           width="16" height="16" loading="lazy"
           onerror="this.style.display='none'" />
      <a class="link-btn"
         href="${escapeAttr(link.url)}"
         target="_blank"
         rel="noopener noreferrer">${escapeHtml(link.label)}</a>
      <button class="link-delete-btn"
              title="Remove link"
              aria-label="Remove ${escapeHtml(link.label)}">✕</button>
    `;

    item.querySelector('.link-delete-btn').addEventListener('click', () => {
      links = links.filter(l => l.id !== link.id);
      saveLinks();
      renderLinks();
    });

    linksGrid.appendChild(item);
  });
}

function addLink() {
  const label = linkNameInput.value.trim();
  let   url   = linkUrlInput.value.trim();
  if (!label || !url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  links.push({ id: Date.now(), label, url, createdAt: Date.now() });
  saveLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  renderLinks();
}

linkAddBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown',  e => { if (e.key === 'Enter') addLink(); });
linkNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });

renderLinks();


/* ══════════════════════════════════════════════
   7. LOCAL STORAGE DATABASE PANEL
   ══════════════════════════════════════════════ */
const dbContent     = document.getElementById('db-content');
const dbRecordCount = document.getElementById('db-record-count');
const dbTabs        = document.querySelectorAll('.db-tab');
const dbRefreshBtn  = document.getElementById('db-refresh-btn');
const dbToggleBtn   = document.getElementById('db-toggle-btn');
const dbBody        = document.getElementById('db-body');

let activeDbTab = 'todos';

/* ── Tab switching ── */
dbTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    dbTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeDbTab = tab.dataset.key;
    renderStoragePanel();
  });
});

/* ── Collapse / Expand ── */
dbToggleBtn.addEventListener('click', () => {
  const collapsed = dbBody.classList.toggle('hidden');
  dbToggleBtn.textContent = collapsed ? '▼ Show' : '▲ Hide';
});

/* ── Manual refresh ── */
dbRefreshBtn.addEventListener('click', renderStoragePanel);

/* ── Main render function ── */
function renderStoragePanel() {
  const todosData  = StorageDB.get(StorageDB.KEYS.todos)  || [];
  const linksData  = StorageDB.get(StorageDB.KEYS.links)  || [];
  const totalRecs  = todosData.length + linksData.length;
  dbRecordCount.textContent = `${totalRecs} record${totalRecs !== 1 ? 's' : ''}`;

  if (activeDbTab === 'todos')    renderDbTodos(todosData);
  else if (activeDbTab === 'quickLinks') renderDbLinks(linksData);
  else if (activeDbTab === 'settings')  renderDbSettings();
}

/* ── Tasks table ── */
function renderDbTodos(data) {
  if (!data.length) {
    dbContent.innerHTML = `<p class="db-empty">No tasks saved yet.</p>`;
    return;
  }

  const rows = data.map((t, i) => `
    <tr>
      <td class="db-cell-id">${i + 1}</td>
      <td class="db-cell-text">${escapeHtml(t.text)}</td>
      <td>
        <span class="db-status ${t.done ? 'done' : 'pending'}">
          ${t.done ? '✅ Done' : '⏳ Pending'}
        </span>
      </td>
      <td class="db-cell-id">${fmtTimestamp(t.createdAt)}</td>
      <td class="db-cell-id">${t.updatedAt ? fmtTimestamp(t.updatedAt) : '—'}</td>
    </tr>
  `).join('');

  dbContent.innerHTML = `
    <table class="db-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Task</th>
          <th>Status</th>
          <th>Created</th>
          <th>Updated</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/* ── Links table ── */
function renderDbLinks(data) {
  if (!data.length) {
    dbContent.innerHTML = `<p class="db-empty">No links saved yet.</p>`;
    return;
  }

  const rows = data.map((l, i) => `
    <tr>
      <td class="db-cell-id">${i + 1}</td>
      <td>${escapeHtml(l.label)}</td>
      <td class="db-cell-id">
        <a href="${escapeAttr(l.url)}" target="_blank"
           rel="noopener noreferrer"
           style="color:var(--primary);font-size:.78rem;">
          ${escapeHtml(l.url.length > 50 ? l.url.slice(0, 50) + '…' : l.url)}
        </a>
      </td>
      <td class="db-cell-id">${fmtTimestamp(l.createdAt)}</td>
    </tr>
  `).join('');

  dbContent.innerHTML = `
    <table class="db-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Label</th>
          <th>URL</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/* ── Settings key-value ── */
function renderDbSettings() {
  const rows = [
    { key: 'userName',       label: 'User Name',          val: StorageDB.getString(StorageDB.KEYS.userName) || '(not set)' },
    { key: 'theme',          label: 'Theme',               val: StorageDB.getString(StorageDB.KEYS.theme) || 'light' },
    { key: 'pomodoroMinutes',label: 'Pomodoro Duration',   val: (StorageDB.getString(StorageDB.KEYS.pomodoro) || '25') + ' min' },
  ];

  const kv = rows.map(r => `
    <div class="db-kv-row">
      <div class="db-kv-key">${r.label}</div>
      <div class="db-kv-val">${escapeHtml(r.val)}</div>
    </div>
  `).join('');

  dbContent.innerHTML = `<div class="db-kv">${kv}</div>`;
}

// Initial render
renderStoragePanel();


/* ══════════════════════════════════════════════
   8. HELPERS
   ══════════════════════════════════════════════ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fmtTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}
