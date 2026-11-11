// ============================================================
// Tasks page
// Features: add / edit / delete / complete, search, filters, sort,
// form validation, dashboard (numbers, ring, weekly chart, priority bars)
// Data is saved in localStorage.
// ============================================================

const STORAGE_KEY = 'scholara-tasks';

// objects used as small dictionaries
const priorityOrder = { high: 1, medium: 2, low: 3 };
const priorityLabel = { high: 'High', medium: 'Medium', low: 'Low' };

// ---------- find the elements ----------
const greeting = document.getElementById('greeting');

const statTotal = document.getElementById('stat-total');
const statDone = document.getElementById('stat-done');
const statPending = document.getElementById('stat-pending');
const statOverdue = document.getElementById('stat-overdue');

const ringBar = document.getElementById('ring-bar');
const ringPercent = document.getElementById('ring-percent');
const ringMessage = document.getElementById('ring-message');
const ringSub = document.getElementById('ring-sub');
const weekChart = document.getElementById('week-chart');
const weekTotal = document.getElementById('week-total');
const priorityList = document.getElementById('priority-list');
const subjectRings = document.getElementById('subject-rings');
const subjectNote = document.getElementById('subject-note');

const form = document.getElementById('task-form');
const formTitle = document.getElementById('form-title');
const titleInput = document.getElementById('title');
const subjectInput = document.getElementById('subject');
const priorityInput = document.getElementById('priority');
const dueInput = document.getElementById('due');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

const searchInput = document.getElementById('search-input');
const priorityFilter = document.getElementById('priority-filter');
const sortSelect = document.getElementById('sort-select');
const tabs = document.querySelectorAll('.tab');
const taskList = document.getElementById('task-list');
const emptyBox = document.getElementById('empty');
const listCount = document.getElementById('list-count');
const clearDoneBtn = document.getElementById('clear-done');

// ---------- date helpers ----------
// turn a Date into "2026-11-10"
function toISO(date){
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

function todayISO(){
    return toISO(new Date());
}

// the date that is "offset" days from today (-1 = yesterday, 2 = in 2 days)
function dayFromToday(offset){
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return toISO(date);
}

// turn "2026-11-10" back into a Date
function parseISO(text){
    const parts = text.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

// how many days from today until this date (negative = in the past)
function daysUntil(text){
    const diff = parseISO(text) - parseISO(todayISO());
    return Math.round(diff / 86400000);
}

// ---------- data ----------
// some example tasks for the first visit (delete this function if you do not want them)
function getSampleTasks(){
    return [
        { id: 1, title: 'Finish math exercises', subject: 'Math', priority: 'high', due: dayFromToday(1), done: false, completedAt: null },
        { id: 2, title: 'Write English essay', subject: 'English', priority: 'high', due: dayFromToday(-1), done: false, completedAt: null },
        { id: 3, title: 'Submit chemistry lab report', subject: 'Chemistry', priority: 'high', due: dayFromToday(0), done: false, completedAt: null },
        { id: 4, title: 'Read biology chapter 5', subject: 'Biology', priority: 'medium', due: dayFromToday(3), done: false, completedAt: null },
        { id: 5, title: 'Prepare JavaScript quiz', subject: 'JavaScript', priority: 'medium', due: dayFromToday(2), done: false, completedAt: null },
        { id: 6, title: 'Review history notes', subject: 'History', priority: 'low', due: dayFromToday(5), done: false, completedAt: null },
        { id: 7, title: 'Solve physics problems', subject: 'Physics', priority: 'medium', due: dayFromToday(-1), done: true, completedAt: dayFromToday(-1) },
        { id: 8, title: 'Practice vocabulary cards', subject: 'English', priority: 'low', due: dayFromToday(-3), done: true, completedAt: dayFromToday(-3) },
        { id: 9, title: 'Prepare group meeting notes', subject: 'JavaScript', priority: 'medium', due: dayFromToday(-2), done: true, completedAt: dayFromToday(-2) },
        { id: 10, title: 'Finish algebra homework', subject: 'Math', priority: 'high', due: dayFromToday(0), done: true, completedAt: dayFromToday(0) },
        { id: 11, title: 'Summarize history chapter', subject: 'History', priority: 'low', due: dayFromToday(-4), done: true, completedAt: dayFromToday(-4) },
        { id: 12, title: 'Revise chemistry formulas', subject: 'Chemistry', priority: 'medium', due: dayFromToday(-1), done: true, completedAt: dayFromToday(0) },
        { id: 13, title: 'Practice geometry problems', subject: 'Math', priority: 'medium', due: dayFromToday(-5), done: true, completedAt: dayFromToday(-5) },
        { id: 14, title: 'Review algebra notes', subject: 'Math', priority: 'low', due: dayFromToday(-6), done: true, completedAt: dayFromToday(-6) }
    ];
}

function loadTasks(){
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved){
        return JSON.parse(saved);
    }
    return getSampleTasks();
}

let tasks = loadTasks();      // the main array of task objects
let currentFilter = 'all';    // all | active | done
let editingId = null;         // id of the task we are editing (null = adding new)

function saveTasks(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function isOverdue(task){
    return !task.done && task.due < todayISO();
}

// make text safe before putting it inside HTML
function escapeHtml(text){
    const box = document.createElement('div');
    box.textContent = text;
    return box.innerHTML;
}

// ---------- small message ----------
const toast = document.createElement('div');
toast.className = 'toast';
document.body.appendChild(toast);

let toastTimer;
function showToast(text){
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

// ============================================================
// Dashboard
// ============================================================
function renderGreeting(){
    const hour = new Date().getHours();
    let word;

    if (hour < 12){
        word = 'Good morning';
    } else if (hour < 18){
        word = 'Good afternoon';
    } else {
        word = 'Good evening';
    }

    const dateText = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    greeting.textContent = word + '! Today is ' + dateText + '.';
}

function renderStats(){
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;

    statTotal.textContent = total;
    statDone.textContent = done;
    statPending.textContent = total - done;
    statOverdue.textContent = tasks.filter(isOverdue).length;
}

function renderRing(){
    const total = tasks.length;
    const done = tasks.filter(t => t.done).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    // a circle with radius 52 has this length around it
    const circle = 2 * Math.PI * 52;
    ringBar.style.strokeDasharray = circle;
    ringBar.style.strokeDashoffset = circle * (1 - percent / 100);

    ringPercent.textContent = percent + '%';
    ringSub.textContent = done + ' of ' + total + ' tasks done';

    let message;
    if (total === 0){
        message = 'Add your first task';
    } else if (percent === 100){
        message = 'All done. Great job!';
    } else if (percent >= 60){
        message = 'Almost there, keep going';
    } else if (percent >= 30){
        message = 'Good progress';
    } else {
        message = 'Every task starts with one step';
    }
    ringMessage.textContent = message;
}

function renderWeek(){
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = [];

    // loop over the last 7 days (6 days ago ... today)
    for (let i = 6; i >= 0; i--){
        const iso = dayFromToday(-i);
        days.push({
            iso: iso,
            label: dayNames[parseISO(iso).getDay()],
            count: tasks.filter(t => t.completedAt === iso).length
        });
    }

    const highest = Math.max(...days.map(d => d.count), 1);
    const sum = days.reduce((total, d) => total + d.count, 0);

    weekChart.innerHTML = days.map(d => `
        <div class="bar-col">
            <span class="bar-value">${d.count > 0 ? d.count : ''}</span>
            <div class="bar-track">
                <div class="bar ${d.iso === todayISO() ? 'today' : ''}" style="height:${(d.count / highest) * 100}%"></div>
            </div>
            <span class="bar-label">${d.label}</span>
        </div>`).join('');

    weekTotal.textContent = sum + ' in 7 days';
}

function renderPriority(){
    const open = tasks.filter(t => !t.done);

    priorityList.innerHTML = ['high', 'medium', 'low'].map(level => {
        const count = open.filter(t => t.priority === level).length;
        const width = open.length === 0 ? 0 : (count / open.length) * 100;

        return `
            <div>
                <div class="prio-row-top"><span>${priorityLabel[level]}</span><span>${count} open</span></div>
                <div class="prio-track"><div class="prio-fill p-${level}" style="width:${width}%"></div></div>
            </div>`;
    }).join('');
}

function renderSubjects(){
    // 1. group the tasks by subject (an object that holds one small object per subject)
    const groups = {};

    tasks.forEach(t => {
        if (!groups[t.subject]){
            groups[t.subject] = { name: t.subject, total: 0, done: 0 };
        }
        groups[t.subject].total++;
        if (t.done) groups[t.subject].done++;
    });

    // 2. make an array, put the subjects with most tasks first, keep 6
    const all = Object.values(groups).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    const list = all.slice(0, 6);

    if (list.length === 0){
        subjectRings.innerHTML = '<p class="muted">Add tasks to see your progress by subject.</p>';
        subjectNote.textContent = '';
        return;
    }

    subjectNote.textContent = all.length > 6 ? 'Top 6 of ' + all.length + ' subjects' : all.length + (all.length === 1 ? ' subject' : ' subjects');

    // a circle with radius 26 has this length around it
    const circle = 2 * Math.PI * 26;

    // 3. draw one small ring for each subject
    subjectRings.innerHTML = list.map(s => {
        const percent = Math.round((s.done / s.total) * 100);
        const offset = circle * (1 - percent / 100);

        let level = 'low';
        if (percent >= 70){
            level = 'high';
        } else if (percent >= 40){
            level = 'mid';
        }

        return `
            <div class="subject">
                <div class="mini-ring">
                    <svg viewBox="0 0 64 64" aria-hidden="true">
                        <circle class="mini-track" cx="32" cy="32" r="26"></circle>
                        <circle class="mini-bar ${level}" cx="32" cy="32" r="26" style="--len:${circle};stroke-dasharray:${circle};stroke-dashoffset:${offset}"></circle>
                    </svg>
                    <span>${percent}%</span>
                </div>
                <strong>${escapeHtml(s.name)}</strong>
                <small>${s.done} of ${s.total} done</small>
            </div>`;
    }).join('');
}

// ============================================================
// Task list
// ============================================================
function getVisibleTasks(){
    const query = searchInput.value.trim().toLowerCase();
    const priority = priorityFilter.value;

    // 1. filter
    const list = tasks.filter(t => {
        if (currentFilter === 'active' && t.done) return false;
        if (currentFilter === 'done' && !t.done) return false;
        if (priority !== 'all' && t.priority !== priority) return false;

        if (query !== ''){
            const text = (t.title + ' ' + t.subject).toLowerCase();
            if (!text.includes(query)) return false;
        }
        return true;
    });

    // 2. sort (finished tasks always go to the bottom)
    const sortBy = sortSelect.value;

    list.sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1;

        if (sortBy === 'priority'){
            return (priorityOrder[a.priority] - priorityOrder[b.priority]) || a.due.localeCompare(b.due);
        }
        if (sortBy === 'name') return a.title.localeCompare(b.title);
        if (sortBy === 'newest') return b.id - a.id;
        return a.due.localeCompare(b.due);   // due date
    });

    return list;
}

// text like "Tomorrow", "Overdue 2d", "Mon, Nov 12"
function getDueInfo(task){
    const days = daysUntil(task.due);
    const dateText = parseISO(task.due).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    if (task.done) return { text: dateText, css: '' };
    if (days < 0) return { text: dateText + ' - overdue', css: 'late' };
    if (days === 0) return { text: 'Today', css: 'soon' };
    if (days === 1) return { text: 'Tomorrow', css: 'soon' };
    return { text: dateText, css: '' };
}

function renderList(){
    const visible = getVisibleTasks();

    taskList.innerHTML = visible.map(task => {
        const due = getDueInfo(task);

        return `
            <li class="task ${task.done ? 'done' : ''}" data-id="${task.id}">
                <button class="check" data-action="toggle" aria-label="Mark as done"><i class="ri-check-line"></i></button>
                <div class="task-main">
                    <h3>${escapeHtml(task.title)}</h3>
                    <div class="task-meta">
                        <span class="tag">${escapeHtml(task.subject)}</span>
                        <span class="tag p-${task.priority}">${priorityLabel[task.priority]}</span>
                        <span class="due ${due.css}"><i class="ri-calendar-line"></i>${due.text}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button data-action="edit" aria-label="Edit task"><i class="ri-edit-line"></i></button>
                    <button data-action="delete" aria-label="Delete task"><i class="ri-delete-bin-line"></i></button>
                </div>
            </li>`;
    }).join('');

    emptyBox.hidden = visible.length !== 0;
    listCount.textContent = visible.length + (visible.length === 1 ? ' task' : ' tasks');

    // numbers on the tabs
    document.getElementById('count-all').textContent = tasks.length;
    document.getElementById('count-active').textContent = tasks.filter(t => !t.done).length;
    document.getElementById('count-done').textContent = tasks.filter(t => t.done).length;
}

function renderAll(){
    renderStats();
    renderRing();
    renderWeek();
    renderPriority();
    renderSubjects();
    renderList();
}

// ============================================================
// Actions
// ============================================================
function toggleTask(id){
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.done = !task.done;
    task.completedAt = task.done ? todayISO() : null;

    saveTasks();
    renderAll();
    showToast(task.done ? 'Task completed' : 'Task moved back to active');
}

function deleteTask(id){
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    if (!confirm('Delete "' + task.title + '"?')) return;

    tasks = tasks.filter(t => t.id !== id);

    // if we were editing this task, reset the form
    if (editingId === id) resetForm();

    saveTasks();
    renderAll();
    showToast('Task deleted');
}

function startEdit(id){
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingId = id;
    titleInput.value = task.title;
    subjectInput.value = task.subject;
    priorityInput.value = task.priority;
    dueInput.value = task.due;

    formTitle.textContent = 'Edit task';
    submitBtn.textContent = 'Save changes';
    cancelBtn.hidden = false;
    clearErrors();

    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    titleInput.focus();
}

function resetForm(){
    editingId = null;
    form.reset();
    priorityInput.value = 'medium';
    dueInput.value = dayFromToday(1);   // default: tomorrow

    formTitle.textContent = 'Add a task';
    submitBtn.textContent = 'Add task';
    cancelBtn.hidden = true;
    clearErrors();
}

// ============================================================
// Form validation
// ============================================================
function setError(inputId, message){
    const field = document.getElementById(inputId).closest('.field');
    field.classList.toggle('error', message !== '');
    field.querySelector('.error-text').textContent = message;
}

function clearErrors(){
    ['title', 'subject', 'priority', 'due'].forEach(id => setError(id, ''));
}

function validateForm(){
    const title = titleInput.value.trim();
    const due = dueInput.value;
    let ok = true;

    // title
    const exists = tasks.some(t =>
        !t.done && t.id !== editingId && t.title.toLowerCase() === title.toLowerCase()
    );

    if (title.length < 3){
        setError('title', 'Write at least 3 letters.');
        ok = false;
    } else if (title.length > 60){
        setError('title', 'Maximum 60 letters.');
        ok = false;
    } else if (exists){
        setError('title', 'This task already exists.');
        ok = false;
    } else {
        setError('title', '');
    }

    // subject
    if (subjectInput.value === ''){
        setError('subject', 'Please choose a subject.');
        ok = false;
    } else {
        setError('subject', '');
    }

    // priority
    if (priorityOrder[priorityInput.value] === undefined){
        setError('priority', 'Please choose a priority.');
        ok = false;
    } else {
        setError('priority', '');
    }

    // due date (a new task cannot be in the past)
    const original = editingId ? tasks.find(t => t.id === editingId) : null;
    const dateChanged = !original || original.due !== due;

    if (due === ''){
        setError('due', 'Please choose a date.');
        ok = false;
    } else if (due < todayISO() && dateChanged){
        setError('due', 'The date cannot be in the past.');
        ok = false;
    } else {
        setError('due', '');
    }

    return ok;
}

// ============================================================
// Events
// ============================================================
form.addEventListener('submit', (e) => {
    e.preventDefault();   // do not reload the page

    if (!validateForm()) return;

    const data = {
        title: titleInput.value.trim(),
        subject: subjectInput.value,
        priority: priorityInput.value,
        due: dueInput.value
    };

    if (editingId){
        // update the old task object
        const task = tasks.find(t => t.id === editingId);
        task.title = data.title;
        task.subject = data.subject;
        task.priority = data.priority;
        task.due = data.due;
        showToast('Task updated');
    } else {
        // make a new task object
        tasks.push({
            id: Date.now(),
            title: data.title,
            subject: data.subject,
            priority: data.priority,
            due: data.due,
            done: false,
            completedAt: null
        });
        showToast('Task added');
    }

    saveTasks();
    resetForm();
    renderAll();
});

cancelBtn.addEventListener('click', resetForm);

// remove the red error while the user types
form.addEventListener('input', (e) => {
    if (e.target.id) setError(e.target.id, '');
});

// one listener for all buttons inside the list
taskList.addEventListener('click', (e) => {
    const button = e.target.closest('[data-action]');
    if (!button) return;

    const id = Number(button.closest('.task').dataset.id);
    const action = button.dataset.action;

    if (action === 'toggle') toggleTask(id);
    if (action === 'edit') startEdit(id);
    if (action === 'delete') deleteTask(id);
});

// tabs: All / Active / Done
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        currentFilter = tab.dataset.filter;
        tabs.forEach(t => t.classList.toggle('active', t === tab));
        renderList();
    });
});

searchInput.addEventListener('input', renderList);
priorityFilter.addEventListener('change', renderList);
sortSelect.addEventListener('change', renderList);

clearDoneBtn.addEventListener('click', () => {
    const doneCount = tasks.filter(t => t.done).length;

    if (doneCount === 0){
        showToast('No completed tasks to clear');
        return;
    }

    tasks = tasks.filter(t => !t.done);
    saveTasks();
    renderAll();
    showToast(doneCount + ' completed tasks cleared');
});

// ---------- start ----------
renderGreeting();
resetForm();
renderAll();
