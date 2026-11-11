// grades page script (only this page's owner edits this file)
 // ---------- Data ----------
  // Each course is an object: { id, name, grade, credits }
  const SAMPLE = [
    { id: 1, name: "Introduction to Design", grade: 94, credits: 3 },
    { id: 2, name: "Web Development", grade: 88, credits: 4 },
    { id: 3, name: "Academic Writing", grade: 91, credits: 2 },
    { id: 4, name: "Mathematics II", grade: 79, credits: 3 },
    { id: 5, name: "Digital Media", grade: 85, credits: 3 }
  ];
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
  };
  let courses = store.get("studyhub.courses", SAMPLE);

  const $ = id => document.getElementById(id);
  const ICON = (d) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONS = {
    moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'
  };

  // ---------- Helpers ----------
  const rubric = g => g >= 90 ? { letter: "A", points: 4 } : g >= 80 ? { letter: "B", points: 3 } :
                      g >= 70 ? { letter: "C", points: 2 } : g >= 60 ? { letter: "D", points: 1 } : { letter: "F", points: 0 };
  const standingOf = gpa => gpa >= 3.5 ? "Excellent" : gpa >= 2.5 ? "Good" : gpa >= 1.5 ? "Needs effort" : "At risk";
  const MESSAGES = {
    "Excellent": ["Excellent work!", "Your results are outstanding. Keep this routine going."],
    "Good": ["You're doing well!", "Steady progress. A little extra effort lifts your GPA further."],
    "Needs effort": ["Room to grow", "Focus on your lowest grades first and plan regular study time."],
    "At risk": ["Time to refocus", "Talk to your instructors and make a recovery plan this week."]
  };
  const escapeHTML = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function summarize() {
    const credits = courses.reduce((sum, c) => sum + c.credits, 0);
    const points = courses.reduce((sum, c) => sum + rubric(c.grade).points * c.credits, 0);
    const gpa = credits ? points / credits : 0;
    const grades = courses.map(c => c.grade);
    return {
      credits, gpa,
      standing: courses.length ? standingOf(gpa) : "-",
      avg: grades.length ? grades.reduce((a, b) => a + b, 0) / grades.length : null,
      max: grades.length ? Math.max(...grades) : null,
      min: grades.length ? Math.min(...grades) : null
    };
  }

  function sortedCourses() {
    const list = [...courses];
    switch ($("sortSelect").value) {
      case "grade-desc": return list.sort((a, b) => b.grade - a.grade);
      case "grade-asc": return list.sort((a, b) => a.grade - b.grade);
      case "credits": return list.sort((a, b) => b.credits - a.credits);
      case "name": return list.sort((a, b) => a.name.localeCompare(b.name));
      default: return list;
    }
  }

  // ---------- Render ----------
  function render() {
    const s = summarize();
    const pct = v => v === null ? "-" : v.toFixed(1) + "%";
    $("gpaStat").textContent = s.gpa.toFixed(2);
    $("creditsStat").textContent = s.credits;
    $("coursesStat").textContent = courses.length;
    $("standingStat").textContent = s.standing;
    $("standingNote").textContent = courses.length ? "Based on your weighted GPA" : "Add a course to begin";
    $("ringValue").textContent = s.gpa.toFixed(2);
    $("ring").style.setProperty("--p", (s.gpa / 4) * 100);
    $("avgStat").textContent = pct(s.avg);
    $("maxStat").textContent = pct(s.max);
    $("minStat").textContent = pct(s.min);
    $("statusChip").textContent = courses.length ? s.standing + " standing" : "No standing yet";
    const msg = MESSAGES[s.standing] || ["No courses yet", "Add a course to see your standing."];
    $("statusHeadline").textContent = msg[0];
    $("statusText").textContent = msg[1];

    $("courseRows").innerHTML = sortedCourses().map(c => {
      const r = rubric(c.grade);
      const cls = r.points >= 3 ? "high" : r.points === 2 ? "mid" : "low";
      const initials = c.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
      return `<tr>
        <td><span class="course-dot">${escapeHTML(initials)}</span><span class="fw-semibold">${escapeHTML(c.name)}</span></td>
        <td>${Number(c.grade).toFixed(1)}%</td>
        <td><span class="pill ${cls}">${r.letter}</span></td>
        <td>${c.credits}</td>
        <td class="fw-semibold">${r.points.toFixed(1)}</td>
        <td class="text-end"><button class="icon-btn" type="button" data-remove="${c.id}" aria-label="Remove ${escapeHTML(c.name)}">${ICON(ICONS.trash)}</button></td>
      </tr>`;
    }).join("");
    $("emptyState").hidden = courses.length > 0;
    $("courseTable").hidden = courses.length === 0;
  }

  // ---------- Validation ----------
  function setError(input, errorId, message) {
    input.classList.toggle("is-invalid", Boolean(message));
    $(errorId).textContent = message;
    return !message;
  }
  function validate() {
    const name = $("courseName").value.trim();
    const gradeRaw = $("courseGrade").value.trim();
    const creditsRaw = $("courseCredits").value.trim();
    const grade = Number(gradeRaw), credits = Number(creditsRaw);

    let nameMsg = "";
    if (name.length < 2) nameMsg = "Enter a course name (at least 2 characters).";
    else if (courses.some(c => c.name.toLowerCase() === name.toLowerCase())) nameMsg = "A course with this name already exists.";

    let gradeMsg = "";
    if (gradeRaw === "" || !Number.isFinite(grade)) gradeMsg = "Enter a grade.";
    else if (grade < 0 || grade > 100) gradeMsg = "Use a number from 0 to 100.";

    let creditsMsg = "";
    if (creditsRaw === "" || !Number.isFinite(credits)) creditsMsg = "Enter the credits.";
    else if (!Number.isInteger(credits) || credits < 1 || credits > 10) creditsMsg = "Use a whole number from 1 to 10.";

    const ok = [setError($("courseName"), "nameError", nameMsg), setError($("courseGrade"), "gradeError", gradeMsg), setError($("courseCredits"), "creditsError", creditsMsg)];
    return ok.every(Boolean) ? { name, grade, credits } : null;
  }

  let toastTimer;
  function toast(message) {
    const box = $("toast");
    box.textContent = message;
    box.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => box.classList.remove("show"), 2800);
  }

  // ---------- Events ----------
  $("courseForm").addEventListener("submit", e => {
    e.preventDefault();
    const data = validate();
    if (!data) return;
    courses.push({ id: Date.now(), ...data });
    store.set("studyhub.courses", courses);
    e.target.reset();
    render();
    toast("Course added. GPA updated.");
    $("courseName").focus();
  });

  $("courseRows").addEventListener("click", e => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    courses = courses.filter(c => c.id !== Number(btn.dataset.remove));
    store.set("studyhub.courses", courses);
    render();
    toast("Course removed.");
  });

  ["courseName", "courseGrade", "courseCredits"].forEach(id =>
    $(id).addEventListener("input", () => $(id).classList.remove("is-invalid")));
  $("sortSelect").addEventListener("change", render);

  // Dark mode disabled: always light theme
  document.documentElement.dataset.theme = "light";

  render();

