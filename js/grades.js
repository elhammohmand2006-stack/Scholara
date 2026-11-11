(function () {
    "use strict";

    /* =====================================
       1. PAGE ELEMENTS
    ===================================== */

    const form = document.getElementById("courseForm");

    if (!form) {
        return;
    }

    const courseName = document.getElementById("courseName");
    const courseGrade = document.getElementById("courseGrade");
    const courseCredits = document.getElementById("courseCredits");
    const courseRows = document.getElementById("courseRows");
    const sortSelect = document.getElementById("sortSelect");
    const cancelEdit = document.getElementById("cancelEdit");
    const saveButton = document.getElementById("saveCourse");
    const notice = document.getElementById("dataNotice");
    const storageNote = document.getElementById("storageNote");
    const toastBox = document.getElementById("toast");

    /* =====================================
       2. STATE AND PROJECT RULES
    ===================================== */

    // Keep the old key so existing valid course records are retained.
    const STORAGE_KEY = "studyhub.courses";

    const MESSAGES = {
        "Excellent": [
            "Excellent work!",
            "Your effort is showing. Keep building on this routine."
        ],
        "Good": [
            "You’re doing well!",
            "Steady progress. Keep giving your learning time and attention."
        ],
        "Needs effort": [
            "There’s room to grow",
            "Start with one challenging course and one manageable study goal."
        ],
        "At risk": [
            "A fresh plan can help",
            "Consider discussing your next steps with your instructors."
        ]
    };

    let courses = [];
    let editingId = null;
    let toastTimer = null;
    let storageAvailable = true;
    let storageReadBlocked = false;

    /* =====================================
       3. GRADE CONVERSION
    ===================================== */

    function gradeToPoints(grade) {
        if (grade >= 90) {
            return { letter: "A", points: 4 };
        }

        if (grade >= 80) {
            return { letter: "B", points: 3 };
        }

        if (grade >= 70) {
            return { letter: "C", points: 2 };
        }

        if (grade >= 60) {
            return { letter: "D", points: 1 };
        }

        return { letter: "F", points: 0 };
    }

    function progressLevel(gpa) {
        // These thresholds are project rules, not institutional policy.
        if (gpa >= 3.5) {
            return "Excellent";
        }

        if (gpa >= 2.5) {
            return "Good";
        }

        if (gpa >= 1.5) {
            return "Needs effort";
        }

        return "At risk";
    }

    /* =====================================
       4. LOCAL STORAGE AND DATA VALIDATION
    ===================================== */

    function makeId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `course-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    function normalizeStoredCourse(value) {
        if (!value || typeof value.name !== "string") {
            return null;
        }

        const name = value.name.trim();

        const validGradeType =
            typeof value.grade === "number" ||
            (typeof value.grade === "string" && value.grade.trim() !== "");

        const validCreditsType =
            typeof value.credits === "number" ||
            (typeof value.credits === "string" && value.credits.trim() !== "");

        if (!validGradeType || !validCreditsType) {
            return null;
        }

        const grade = Number(value.grade);
        const credits = Number(value.credits);

        if (name.length < 2 || name.length > 45) {
            return null;
        }

        if (!Number.isFinite(grade) || grade < 0 || grade > 100) {
            return null;
        }

        if (!Number.isInteger(credits) || credits < 1 || credits > 10) {
            return null;
        }

        const validId =
            (typeof value.id === "string" && value.id.length > 0) ||
            (typeof value.id === "number" && Number.isFinite(value.id));

        return {
            id: validId ? String(value.id) : makeId(),
            name: name,
            grade: grade,
            credits: credits
        };
    }

    function loadCourses() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (raw === null) {
                return;
            }

            const saved = JSON.parse(raw);

            if (!Array.isArray(saved)) {
                throw new Error("Saved courses must be an array.");
            }

            const usedIds = new Set();
            const usedNames = new Set();
            let skipped = 0;

            for (const entry of saved) {
                const course = normalizeStoredCourse(entry);

                if (!course) {
                    skipped++;
                    continue;
                }

                const nameKey = course.name.toLocaleLowerCase();

                if (usedNames.has(nameKey)) {
                    skipped++;
                    continue;
                }

                if (usedIds.has(course.id)) {
                    course.id = makeId();
                }

                usedIds.add(course.id);
                usedNames.add(nameKey);
                courses.push(course);
            }

            if (skipped > 0) {
                // Do not overwrite the original data automatically.
                notice.textContent =
                    `${skipped} invalid or duplicate saved record(s) were skipped. ` +
                    "The original storage has not been changed. Back it up before saving new changes.";
            }
        } catch (error) {
            storageAvailable = false;
            storageReadBlocked = true;

            notice.textContent =
                "Saved courses could not be read. The original storage will not be overwritten. " +
                "Changes on this page will remain in memory only.";

            updateStorageMessage();
        }
    }

    function updateStorageMessage() {
        storageNote.textContent = storageAvailable
            ? "Saved in this browser, on this device. Not synced to an account."
            : "Storage is unavailable: changes remain only in this open page and may be lost after reload.";
    }

    function persistCourses(nextCourses) {
        courses = nextCourses;

        if (storageReadBlocked) {
            updateStorageMessage();
            return false;
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
            storageAvailable = true;
        } catch (error) {
            storageAvailable = false;
        }

        updateStorageMessage();

        return storageAvailable;
    }

    /* =====================================
       5. CALCULATE SUMMARY
    ===================================== */

    function calculateSummary() {
        let totalCredits = 0;
        let weightedPoints = 0;
        let totalGrades = 0;
        let highestGrade = null;
        let lowestGrade = null;

        for (const course of courses) {
            totalCredits += course.credits;
            weightedPoints += gradeToPoints(course.grade).points * course.credits;
            totalGrades += course.grade;

            if (highestGrade === null || course.grade > highestGrade) {
                highestGrade = course.grade;
            }

            if (lowestGrade === null || course.grade < lowestGrade) {
                lowestGrade = course.grade;
            }
        }

        const gpa = totalCredits > 0 ? weightedPoints / totalCredits : 0;

        return {
            totalCredits: totalCredits,
            gpa: gpa,
            level: courses.length ? progressLevel(gpa) : "—",
            average: courses.length ? totalGrades / courses.length : null,
            highest: highestGrade,
            lowest: lowestGrade
        };
    }

    function formatPercentage(value) {
        return value === null ? "—" : `${value.toFixed(1)}%`;
    }

    function setText(id, text) {
        document.getElementById(id).textContent = text;
    }

    function renderSummary() {
        const summary = calculateSummary();
        const hasCourses = courses.length > 0;

        setText("gpaStat", summary.gpa.toFixed(2));
        setText("creditsStat", summary.totalCredits);
        setText("coursesStat", courses.length);
        setText("standingStat", summary.level);
        setText("standingNote", hasCourses ? "Based on this project’s GPA rules" : "Add a course to begin");

        setText("ringValue", summary.gpa.toFixed(2));
        setText("avgStat", formatPercentage(summary.average));
        setText("maxStat", formatPercentage(summary.highest));
        setText("minStat", formatPercentage(summary.lowest));
        setText("statusChip", hasCourses ? `${summary.level} progress` : "No progress level yet");

        const ring = document.getElementById("ring");
        const percentage = Math.max(0, Math.min(100, (summary.gpa / 4) * 100));

        ring.style.setProperty("--p", percentage);
        ring.setAttribute("aria-label", `GPA ${summary.gpa.toFixed(2)} out of 4.00`);

        const message = MESSAGES[summary.level] || [
            "Your progress starts here",
            "Add a course to see your progress."
        ];

        setText("statusHeadline", message[0]);
        setText("statusText", message[1]);
    }

    /* =====================================
       6. SORT COURSES
    ===================================== */

    function getSortedCourses() {
        const sorted = [...courses];

        switch (sortSelect.value) {
            case "grade-desc":
                return sorted.sort((first, second) => second.grade - first.grade);

            case "grade-asc":
                return sorted.sort((first, second) => first.grade - second.grade);

            case "credits":
                return sorted.sort((first, second) => second.credits - first.credits);

            case "name":
                return sorted.sort((first, second) => first.name.localeCompare(second.name));

            default:
                return sorted;
        }
    }

    /* =====================================
       7. SAFE TABLE RENDERING
    ===================================== */

    function makeElement(tag, className, text) {
        const element = document.createElement(tag);

        if (className) {
            element.className = className;
        }

        if (text !== undefined) {
            element.textContent = text;
        }

        return element;
    }

    function makeActionButton(action, iconClass, label, id) {
        const button = makeElement("button", "grade-icon-button");
        const icon = makeElement("i", iconClass);

        button.type = "button";
        button.dataset.action = action;
        button.dataset.id = id;
        button.title = label;
        button.setAttribute("aria-label", label);
        icon.setAttribute("aria-hidden", "true");
        button.append(icon);

        return button;
    }

    function createCourseRow(course) {
        const row = document.createElement("tr");
        const conversion = gradeToPoints(course.grade);

        const nameCell = document.createElement("td");
        const nameWrapper = makeElement("div", "grade-course-name");

        const initials = course.name.trim()
            .split(/\s+/u)
            .slice(0, 2)
            .map(word => Array.from(word)[0])
            .join("")
            .toLocaleUpperCase();

        const initialsElement = makeElement("span", "grade-course-initials", initials);
        initialsElement.setAttribute("aria-hidden", "true");

        const name = makeElement("span", "", course.name);
        name.dir = "auto";

        nameWrapper.append(initialsElement, name);
        nameCell.append(nameWrapper);

        const gradeCell = makeElement("td", "", `${course.grade.toFixed(1)}%`);
        const letterCell = document.createElement("td");

        const levelClass = conversion.points >= 3
            ? "high"
            : conversion.points === 2 ? "mid" : "low";

        letterCell.append(makeElement("span", `grade-letter ${levelClass}`, conversion.letter));

        const creditsCell = makeElement("td", "", course.credits);
        const pointsCell = makeElement("td", "", conversion.points.toFixed(1));
        const actionsCell = document.createElement("td");
        const actions = makeElement("div", "grade-row-actions");

        actions.append(
            makeActionButton("edit", "ri-edit-line", `Edit ${course.name}`, course.id),
            makeActionButton("delete", "ri-delete-bin-line", `Remove ${course.name}`, course.id)
        );

        actionsCell.append(actions);
        row.append(nameCell, gradeCell, letterCell, creditsCell, pointsCell, actionsCell);

        return row;
    }

    function renderTable() {
        const fragment = document.createDocumentFragment();

        for (const course of getSortedCourses()) {
            fragment.append(createCourseRow(course));
        }

        courseRows.replaceChildren(fragment);

        document.getElementById("emptyState").hidden = courses.length > 0;
        document.getElementById("tableWrapper").hidden = courses.length === 0;
    }

    function render() {
        renderSummary();
        renderTable();
    }

    /* =====================================
       8. VALIDATION AND ERROR MESSAGES
    ===================================== */

    function setFieldError(input, errorId, message) {
        input.setAttribute("aria-invalid", String(Boolean(message)));
        document.getElementById(errorId).textContent = message;

        return message === "";
    }

    function clearErrors() {
        setFieldError(courseName, "nameError", "");
        setFieldError(courseGrade, "gradeError", "");
        setFieldError(courseCredits, "creditsError", "");
    }

    function validateForm() {
        const name = courseName.value.trim();
        const rawGrade = courseGrade.value.trim();
        const rawCredits = courseCredits.value.trim();

        const grade = Number(rawGrade);
        const credits = Number(rawCredits);

        let nameMessage = "";
        let gradeMessage = "";
        let creditsMessage = "";

        if (name.length < 2 || name.length > 45) {
            nameMessage = "Use a course name with 2 to 45 characters.";
        } else {
            const duplicate = courses.some(function (course) {
                return course.id !== editingId &&
                    course.name.toLocaleLowerCase() === name.toLocaleLowerCase();
            });

            if (duplicate) {
                nameMessage = "A course with this name already exists.";
            }
        }

        if (rawGrade === "" || !Number.isFinite(grade)) {
            gradeMessage = "Enter a grade.";
        } else if (grade < 0 || grade > 100) {
            gradeMessage = "Use a number from 0 to 100.";
        }

        if (rawCredits === "" || !Number.isFinite(credits)) {
            creditsMessage = "Enter the credits.";
        } else if (!Number.isInteger(credits) || credits < 1 || credits > 10) {
            creditsMessage = "Use a whole number from 1 to 10.";
        }

        const checks = [
            setFieldError(courseName, "nameError", nameMessage),
            setFieldError(courseGrade, "gradeError", gradeMessage),
            setFieldError(courseCredits, "creditsError", creditsMessage)
        ];

        if (!checks.every(Boolean)) {
            form.querySelector('[aria-invalid="true"]').focus();
            return null;
        }

        return { name: name, grade: grade, credits: credits };
    }

    /* =====================================
       9. NOTIFICATIONS
    ===================================== */

    function showToast(message) {
        toastBox.textContent = message;
        toastBox.classList.add("show");
        clearTimeout(toastTimer);

        toastTimer = setTimeout(function () {
            toastBox.classList.remove("show");
        }, 4500);
    }

    function showSaveResult(savedMessage) {
        showToast(storageAvailable
            ? savedMessage
            : "Changed in this page only. Browser storage is unavailable; changes may be lost after reload."
        );
    }

    /* =====================================
       10. ADD AND EDIT COURSES
    ===================================== */

    function resetEditor() {
        editingId = null;
        form.reset();
        clearErrors();

        setText("form-title", "Add a course");
        setText("form-description", "Enter the details to update your GPA.");
        saveButton.textContent = "Add course";
        cancelEdit.hidden = true;
    }

    function startEditing(id) {
        const course = courses.find(item => item.id === id);

        if (!course) {
            return;
        }

        editingId = id;
        clearErrors();

        courseName.value = course.name;
        courseGrade.value = course.grade;
        courseCredits.value = course.credits;

        setText("form-title", "Edit course");
        setText("form-description", "Update the details and save your changes.");
        saveButton.textContent = "Save changes";
        cancelEdit.hidden = false;

        courseName.focus();
    }

    function submitCourse(event) {
        event.preventDefault();

        const data = validateForm();

        if (!data) {
            return;
        }

        const wasEditing = editingId !== null;
        let nextCourses;

        if (wasEditing) {
            nextCourses = courses.map(function (course) {
                return course.id === editingId ? { ...course, ...data } : course;
            });
        } else {
            nextCourses = [...courses, { id: makeId(), ...data }];
        }

        persistCourses(nextCourses);
        resetEditor();
        render();
        showSaveResult(wasEditing ? "Course updated. GPA recalculated." : "Course added. GPA updated.");
        courseName.focus();
    }

    /* =====================================
       11. REMOVE COURSES
    ===================================== */

    function removeCourse(id) {
        const course = courses.find(item => item.id === id);

        if (!course) {
            return;
        }

        const confirmed = window.confirm(`Remove “${course.name}” from your grade book?`);

        if (!confirmed) {
            return;
        }

        persistCourses(courses.filter(item => item.id !== id));

        if (editingId === id) {
            resetEditor();
        }

        render();
        showSaveResult("Course removed. GPA updated.");
        courseName.focus();
    }

    /* =====================================
       12. EVENTS
    ===================================== */

    form.addEventListener("submit", submitCourse);
    sortSelect.addEventListener("change", renderTable);

    cancelEdit.addEventListener("click", function () {
        resetEditor();
        courseName.focus();
    });

    courseRows.addEventListener("click", function (event) {
        const button = event.target.closest("button[data-action]");

        if (!button || !courseRows.contains(button)) {
            return;
        }

        if (button.dataset.action === "edit") {
            startEditing(button.dataset.id);
        } else if (button.dataset.action === "delete") {
            removeCourse(button.dataset.id);
        }
    });

    const fields = [
        [courseName, "nameError"],
        [courseGrade, "gradeError"],
        [courseCredits, "creditsError"]
    ];

    for (const [input, errorId] of fields) {
        input.addEventListener("input", function () {
            setFieldError(input, errorId, "");
        });
    }

    /* =====================================
       13. INITIAL SETUP
       common.js controls the sidebar and theme.
       Do not force light mode here.
    ===================================== */

    loadCourses();
    render();

})();
