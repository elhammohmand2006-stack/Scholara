// This file is shared by all pages (sidebar menu + light/dark theme)

const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menu-btn');
const sidebarClose = document.getElementById('sidebar-close');
const overlay = document.getElementById('overlay');
const themeBtn = document.getElementById('theme-btn');

// ---------- sidebar (small screens) ----------
function openSidebar(){
    sidebar.classList.add('open');
    overlay.classList.add('show');
}

function closeSidebar(){
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
}

menuBtn.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
});

// ---------- light / dark theme ----------
// The first time, the site follows the device setting (see the small script in <head>).
// After the user clicks the switch, we remember their choice.
function isDark(){
    return document.documentElement.getAttribute('data-theme') === 'dark';
}

function updateSwitch(){
    themeBtn.setAttribute('aria-checked', isDark());
}

themeBtn.addEventListener('click', () => {
    if (isDark()){
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }

    updateSwitch();
});

updateSwitch();
