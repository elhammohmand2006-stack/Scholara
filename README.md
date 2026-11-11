<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="images/scholara-logo-dark.svg">
    <img src="images/scholara-logo-light.svg" alt="Scholara" width="320">
  </picture>
</p>

<p align="center">
  <b>Your personal study space.</b><br>
  Organize your tasks, manage your time and achieve your study goals.
</p>

<p align="center">
  <a href="https://elhammohmand2006-stack.github.io/Scholara/"><b>Live demo</b></a>
  &nbsp;|&nbsp;
  <a href="#features">Features</a>
  &nbsp;|&nbsp;
  <a href="#javascript-concepts-used">JavaScript concepts</a>
  &nbsp;|&nbsp;
  <a href="#team">Team</a>
</p>

<p align="center">
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-2F4156?style=flat&logo=html5&logoColor=white">
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-567C8D?style=flat&logo=css3&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-E09F5B?style=flat&logo=javascript&logoColor=1B2733">
</p>

---

## About the project

**Scholara** is a multi-page study website made for students. It brings everything a student needs into one calm place: a task manager, a focus timer, a GPA calculator and a notes page.

It is the final JavaScript group project of our web development course. We built it as a team of five, with one page for each member, using only **HTML, CSS and JavaScript** (no frameworks).

**Live website:** https://elhammohmand2006-stack.github.io/Scholara/

---

## Features

### Whole website
- 5 connected pages with a shared sidebar and footer
- **Light and dark mode** with a sliding switch (the first visit follows the device setting, and the choice is saved)
- **Glassmorphism** design with soft blur, transparent cards and gentle shadows
- **Responsive** layout for phone, tablet and computer (the sidebar becomes a slide-in menu on small screens)
- Data is saved in the browser with `localStorage`

### Pages

| Page | What it does |
|---|---|
| **Home** | Welcome section, login and sign up form with validation, study statistics, feature cards and a daily motivation quote |
| **Tasks** | Dashboard with numbers, completion ring, weekly chart, priority bars and progress rings by subject. Add, edit, delete and complete tasks. Search, filter and sort |
| **Timer** | Focus timer (Pomodoro style) with start, pause and reset |
| **Grades** | GPA calculator with a list of courses and grades |
| **Notes** | Write, search and organize study notes |

---

## JavaScript concepts used

This project was built to show the JavaScript topics of the course:

| Concept | Where we used it |
|---|---|
| **Conditions** | Form checks, overdue tasks, greeting by time of day, status messages |
| **Loops** | `for` and `forEach` to build charts, cards and lists |
| **Functions** | Every feature is a separate, named function |
| **Arrays** | Lists of tasks, notes, courses and quotes |
| **Array methods** | `filter`, `map`, `find`, `some`, `reduce`, `sort`, `slice` |
| **Objects** | Each task, note and course is an object; settings and labels use objects too |
| **DOM manipulation** | Creating and updating elements, `classList`, `textContent`, `innerHTML` |
| **Events** | `click`, `submit`, `input`, `change`, `keydown` |
| **Form validation** | Login, sign up, new task and other forms show clear error messages |

---

## Design

| Color | Hex | Used for |
|---|---|---|
| Navy | `#2F4156` | Main color, text, buttons |
| Teal | `#567C8D` | Second color, icons |
| Sky Blue | `#C8D9E6` | Soft backgrounds, borders |
| Beige | `#F5EFEB` | Page background |
| White | `#FFFFFF` | Cards |
| Amber | `#E09F5B` | Accent, highlights |

All colors are saved as CSS variables in `css/style.css`, so light and dark mode change in one place.

**Fonts:** Lora (titles) and Inter (text).  **Icons:** [Remix Icon](https://remixicon.com/).

---

## Project structure

```
Scholara/
├── index.html          # Home page
├── pages/
│   ├── tasks.html
│   ├── timer.html
│   ├── grades.html
│   └── notes.html
├── css/
│   ├── style.css       # shared: colors, sidebar, footer, theme switch
│   ├── glass.css       # shared: glassmorphism style
│   └── (one CSS file for each page)
├── js/
│   ├── common.js       # shared: sidebar menu and theme switch
│   └── (one JS file for each page)
├── images/             # logo and icon (SVG)
└── README.md
```

---

## How to run

1. Download or clone the project:
   ```bash
   git clone https://github.com/elhammohmand2006-stack/Scholara.git
   ```
2. Open the folder in VS Code.
3. Open `index.html` in your browser (or use the **Live Server** extension).

No installation is needed.

---

## Team

| Member | Page | Branch |
|---|---|---|
| **Sohaima** | Home | `feature-home` |
| **Elham** (team leader) | Tasks | `feature-tasks` |
| **Shokoofeh** | Timer | `feature-timer` |
| **Sahar** | Grades | `feature-grades` |
| **Samira** | Notes | `feature-notes` |

Shared files (`style.css`, `glass.css`, `common.js`, README) were prepared by the team leader.

---

## How we worked with Git

- Every member worked on **their own branch** and kept their changes inside their own page files, so we avoided conflicts.
- We made **small commits** with clear messages, for example `add task form with validation`.
- Finished work was sent to `main` with a **Pull Request**, and the team leader reviewed and merged it.
- The website is published with **GitHub Pages**.

---

## What we learned

- Planning a project and sharing the work in a team
- Building a multi-page, responsive website from scratch
- Using JavaScript to make pages interactive and dynamic
- Working with Git branches, commits and Pull Requests
- Reading each other's code and solving bugs together

---

<p align="center">
  Made with care by the Scholara team, 2026.
</p>
