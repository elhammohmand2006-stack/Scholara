(function () {
    "use strict";

    /* =====================================
       1. HTML ELEMENTS
    ===================================== */

    const grid = document.getElementById("notes-grid");

    if (!grid) {
        return;
    }

    const dialog = document.getElementById("note-dialog");
    const form = document.getElementById("note-form");
    const titleInput = document.getElementById("note-title");
    const bodyInput = document.getElementById("note-body");
    const categoryInput = document.getElementById("note-category");
    const tagsInput = document.getElementById("note-tags");
    const pinnedInput = document.getElementById("note-pinned");
    const editorTitle = document.getElementById("editor-title");
    const editorError = document.getElementById("editor-error");
    const wordCount = document.getElementById("word-count");

    const searchInput = document.getElementById("note-search");
    const sortInput = document.getElementById("note-sort");
    const filterButtons = document.querySelectorAll(".filter-button");
    const emptyState = document.getElementById("notes-empty");
    const emptyCreate = document.getElementById("empty-create");
    const status = document.getElementById("notes-status");

    /* =====================================
       2. STATE AND CONSTANTS
    ===================================== */

    const STORAGE_KEY = "scholara.notes.v1";
    const CATEGORIES = ["Lecture", "Revision", "Ideas", "Personal"];
    const COLORS = ["lavender", "blue", "sage", "peach"];

    let notes = [];
    let activeFilter = "all";
    let editingId = null;
    let initialEditorState = "";
    let returnFocus = null;
    let storageAvailable = true;

    /* =====================================
       3. STORAGE AND VALIDATION
    ===================================== */

    function announce(message) {
        status.textContent = message;
    }

    function validDate(value) {
        return typeof value === "string" && Number.isFinite(Date.parse(value));
    }

    function normalizeNote(note) {
        if (!note || typeof note.id !== "string" || !note.id) {
            return null;
        }

        if (typeof note.title !== "string" || typeof note.body !== "string") {
            return null;
        }

        if (!validDate(note.createdAt) || !validDate(note.updatedAt)) {
            return null;
        }

        return {
            id: note.id,
            title: note.title.slice(0, 100),
            body: note.body.slice(0, 20000),
            category: CATEGORIES.includes(note.category) ? note.category : "Lecture",
            color: COLORS.includes(note.color) ? note.color : "lavender",
            tags: Array.isArray(note.tags)
                ? note.tags.filter(tag => typeof tag === "string").slice(0, 6).map(tag => tag.slice(0, 30))
                : [],
            pinned: note.pinned === true,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt
        };
    }

    function loadNotes() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

            if (!Array.isArray(saved)) {
                throw new Error("Invalid saved notes");
            }

            const ids = new Set();

            for (const value of saved) {
                const note = normalizeNote(value);

                if (note && !ids.has(note.id)) {
                    notes.push(note);
                    ids.add(note.id);
                }
            }
        } catch (error) {
            storageAvailable = false;
            announce("Saved notes could not be loaded. Changes will remain only in this open page until storage is available.");
        }
    }

    function persistNotes(nextNotes) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes));
            storageAvailable = true;
        } catch (error) {
            storageAvailable = false;
        }

        notes = nextNotes;

        return storageAvailable;
    }

    function storageMessage(savedText) {
        return storageAvailable
            ? savedText
            : "Changed in this open page only. Browser storage is unavailable or full; changes may be lost when you close or reload.";
    }

    function newId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `note-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    /* =====================================
       4. SEARCH, FILTERING AND SORTING
    ===================================== */

    function getVisibleNotes() {
        const query = searchInput.value.trim().toLocaleLowerCase();

        const visible = notes.filter(function (note) {
            const matchesFilter =
                activeFilter === "all" ||
                (activeFilter === "pinned" && note.pinned) ||
                note.category === activeFilter;

            const searchable = [note.title, note.body, note.category, ...note.tags]
                .join(" ")
                .toLocaleLowerCase();

            return matchesFilter && (!query || searchable.includes(query));
        });

        visible.sort(function (first, second) {
            // Pinned notes are always shown before unpinned notes.
            if (first.pinned !== second.pinned) {
                return Number(second.pinned) - Number(first.pinned);
            }

            if (sortInput.value === "title") {
                return first.title.localeCompare(second.title);
            }

            const key = sortInput.value === "created" ? "createdAt" : "updatedAt";

            return Date.parse(second[key]) - Date.parse(first[key]);
        });

        return visible;
    }

    /* =====================================
       5. SAFE HTML ELEMENT BUILDERS
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

    function makeIconButton(iconClass, label, handler) {
        const button = makeElement("button", "note-icon-button");
        const icon = makeElement("i", iconClass);

        button.type = "button";
        button.title = label;
        button.setAttribute("aria-label", label);
        icon.setAttribute("aria-hidden", "true");

        button.append(icon);
        button.addEventListener("click", handler);

        return button;
    }

    function createNoteCard(note) {
        const card = makeElement("article", "note-card notes-glass");
        card.dataset.color = note.color;

        const top = makeElement("div", "note-card-top");
        const category = makeElement("span", "note-category", note.category);

        const pinButton = makeIconButton(
            note.pinned ? "ri-pushpin-fill" : "ri-pushpin-line",
            `${note.pinned ? "Unpin" : "Pin"} ${note.title}`,
            () => togglePin(note.id)
        );

        pinButton.setAttribute("aria-pressed", String(note.pinned));
        top.append(category, pinButton);

        const openButton = makeElement("button", "note-open");
        openButton.type = "button";
        openButton.setAttribute("aria-label", `Open and edit ${note.title}`);

        const title = makeElement("h3", "", note.title);
        const preview = makeElement("p", "note-preview", note.body || "A title today, more thoughts tomorrow.");

        title.dir = "auto";
        preview.dir = "auto";
        openButton.append(title, preview);
        openButton.addEventListener("click", () => openEditor(note.id));

        const tags = makeElement("div", "note-tags");

        for (const tag of note.tags) {
            const tagElement = makeElement("span", "note-tag", `#${tag}`);
            tagElement.dir = "auto";
            tags.append(tagElement);
        }

        const bottom = makeElement("div", "note-card-bottom");
        const time = makeElement("time");

        time.dateTime = note.updatedAt;
        time.title = new Date(note.updatedAt).toLocaleString();
        time.textContent = new Date(note.updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });

        const actions = makeElement("div", "note-card-actions");

        actions.append(
            makeIconButton("ri-edit-line", `Edit ${note.title}`, () => openEditor(note.id)),
            makeIconButton("ri-delete-bin-line", `Delete ${note.title}`, () => deleteNote(note.id))
        );

        bottom.append(time, actions);
        card.append(top, openButton, tags, bottom);

        return card;
    }

    /* =====================================
       6. RENDER LIBRARY
    ===================================== */

    function renderNotes() {
        const visibleNotes = getVisibleNotes();
        const fragment = document.createDocumentFragment();

        for (const note of visibleNotes) {
            fragment.append(createNoteCard(note));
        }

        grid.replaceChildren(fragment);

        document.getElementById("total-count").textContent = notes.length;
        document.getElementById("pinned-count").textContent = notes.filter(note => note.pinned).length;
        document.getElementById("result-count").textContent =
            `${visibleNotes.length} of ${notes.length} notes`;

        emptyState.hidden = visibleNotes.length > 0;
        const isNewLibrary = notes.length === 0;

        document.getElementById("empty-title").textContent = isNewLibrary
            ? "Your next idea starts here."
            : "No notes found. A different search?";

        document.getElementById("empty-description").textContent = isNewLibrary
            ? "Save a lecture takeaway, a question, or something you don’t want to forget."
            : "Try another keyword or choose All notes to explore your notebook.";

        emptyCreate.hidden = !isNewLibrary;
    }

    /* =====================================
       7. EDITOR HELPERS
    ===================================== */

    function selectedColor() {
        return form.querySelector('input[name="note-color"]:checked').value;
    }

    function editorState() {
        return JSON.stringify({
            title: titleInput.value,
            body: bodyInput.value,
            category: categoryInput.value,
            tags: tagsInput.value,
            pinned: pinnedInput.checked,
            color: selectedColor()
        });
    }

    function updateWordCount() {
        const text = bodyInput.value.trim();
        const count = text ? text.split(/\s+/u).length : 0;

        wordCount.textContent = `${count} ${count === 1 ? "word" : "words"}`;
    }

    function openEditor(id = null) {
        const note = id ? notes.find(item => item.id === id) : null;

        if (id && !note) {
            return;
        }

        returnFocus = document.activeElement;
        editingId = note ? note.id : null;
        form.reset();
        editorError.textContent = "";
        editorTitle.textContent = note ? "A little more to the story." : "Create a note";

        if (note) {
            titleInput.value = note.title;
            bodyInput.value = note.body;
            categoryInput.value = note.category;
            tagsInput.value = note.tags.join(", ");
            pinnedInput.checked = note.pinned;

            for (const radio of form.querySelectorAll('input[name="note-color"]')) {
                radio.checked = radio.value === note.color;
            }
        } else if (CATEGORIES.includes(activeFilter)) {
            categoryInput.value = activeFilter;
        }

        updateWordCount();
        initialEditorState = editorState();
        dialog.showModal();
        titleInput.focus();
    }

    function requestEditorClose() {
        const hasChanges = editorState() !== initialEditorState;

        if (hasChanges && !window.confirm("Discard your unsaved changes?")) {
            return;
        }

        dialog.close();
    }

    function parseTags(text) {
        const tags = text.split(/[,،]/u)
            .map(tag => tag.trim().replace(/^#+/u, "").slice(0, 30))
            .filter(Boolean);

        return [...new Set(tags)].slice(0, 6);
    }

    /* =====================================
       8. CREATE AND UPDATE A NOTE
    ===================================== */

    function saveNote(event) {
        event.preventDefault();

        const title = titleInput.value.trim();

        if (!title) {
            editorError.textContent = "Please give your note a title.";
            titleInput.focus();
            return;
        }

        const existing = notes.find(note => note.id === editingId);
        const now = new Date().toISOString();

        const note = {
            id: existing ? existing.id : newId(),
            title: title,
            body: bodyInput.value.trim(),
            category: categoryInput.value,
            tags: parseTags(tagsInput.value),
            color: selectedColor(),
            pinned: pinnedInput.checked,
            createdAt: existing ? existing.createdAt : now,
            updatedAt: now
        };

        const nextNotes = existing
            ? notes.map(item => item.id === note.id ? note : item)
            : [note, ...notes];

        persistNotes(nextNotes);
        dialog.close();
        renderNotes();
        announce(storageMessage(existing ? "Your note has been updated." : "A new idea, safely noted."));
    }

    /* =====================================
       9. PIN AND DELETE
    ===================================== */

    function togglePin(id) {
        const note = notes.find(item => item.id === id);

        if (!note) {
            return;
        }

        const nextNotes = notes.map(function (item) {
            return item.id === id ? { ...item, pinned: !item.pinned } : item;
        });

        persistNotes(nextNotes);
        renderNotes();
        document.getElementById("new-note").focus();
        announce(storageMessage(note.pinned ? "Note unpinned." : "Note pinned to the top."));
    }

    function deleteNote(id) {
        const note = notes.find(item => item.id === id);

        if (!note || !window.confirm(`Delete “${note.title}”? This cannot be undone.`)) {
            return;
        }

        persistNotes(notes.filter(item => item.id !== id));
        renderNotes();
        document.getElementById("new-note").focus();
        announce(storageMessage("Note deleted."));
    }

    /* =====================================
       10. EVENTS
    ===================================== */

    document.getElementById("new-note").addEventListener("click", () => openEditor());
    emptyCreate.addEventListener("click", () => openEditor());

    document.getElementById("close-editor").addEventListener("click", requestEditorClose);
    document.getElementById("cancel-editor").addEventListener("click", requestEditorClose);

    dialog.addEventListener("cancel", function (event) {
        event.preventDefault();
        requestEditorClose();
    });

    dialog.addEventListener("close", function () {
        if (returnFocus && returnFocus.isConnected) {
            returnFocus.focus();
        } else {
            document.getElementById("new-note").focus();
        }
    });

    form.addEventListener("submit", saveNote);
    bodyInput.addEventListener("input", updateWordCount);
    searchInput.addEventListener("input", renderNotes);
    sortInput.addEventListener("change", renderNotes);

    for (const button of filterButtons) {
        button.addEventListener("click", function () {
            activeFilter = button.dataset.filter;

            for (const filter of filterButtons) {
                const active = filter === button;
                filter.classList.toggle("is-active", active);
                filter.setAttribute("aria-pressed", String(active));
            }

            renderNotes();
        });
    }

    window.addEventListener("beforeunload", function (event) {
        if (dialog.open && editorState() !== initialEditorState) {
            event.preventDefault();
            event.returnValue = "";
        }
    });

    /* =====================================
       11. INITIAL PAGE SETUP
    ===================================== */

    loadNotes();
    renderNotes();

})();
