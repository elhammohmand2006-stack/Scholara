// timer page script (only this page's owner edits this file)
(function () {
    "use strict";

    /* =====================================
       1. SELECT HTML ELEMENTS
    ===================================== */

    const timerDisplay = document.getElementById("timer-display");

    if (!timerDisplay) {
        return;
    }

    const startButton = document.getElementById("start-btn");
    const pauseButton = document.getElementById("pause-btn");
    const resetButton = document.getElementById("reset-btn");
    const soundButton = document.getElementById("sound-btn");

    const durationForm = document.getElementById("duration-form");
    const durationInput = document.getElementById("duration-input");

    const timerMessage = document.getElementById("timer-message");
    const timerState = document.getElementById("timer-state");
    const modeLabel = document.getElementById("mode-label");
    const progressCircle = document.getElementById("progress-circle");
    const modeButtons = document.querySelectorAll(".mode-button");

    const todayDate = document.getElementById("today-date");
    const todaySessions = document.getElementById("today-sessions");
    const todayMinutes = document.getElementById("today-minutes");
    const todayBreaks = document.getElementById("today-breaks");

    const historyList = document.getElementById("history-list");
    const clearHistoryButton = document.getElementById("clear-history");
    const storageNote = document.getElementById("storage-note");

    /* =====================================
       2. TIMER SETTINGS
    ===================================== */

    const HISTORY_KEY = "scholara.timer.history.v1";
    const SOUND_KEY = "scholara.timer.sound.v1";

    const durations = {
        focus: 25,
        break: 5
    };

    const ringRadius = 142;
    const ringCircumference = 2 * Math.PI * ringRadius;

    let currentMode = "focus";
    let totalSeconds = durations.focus * 60;
    let remainingSeconds = totalSeconds;

    let intervalId = null;
    let endTime = 0;
    let isRunning = false;

    let soundEnabled = true;
    let audioContext = null;
    let sessionHistory = [];
    let lastDay = getDayKey(new Date());

    progressCircle.style.strokeDasharray = ringCircumference;

    /* =====================================
       3. DATE AND MESSAGE HELPERS
    ===================================== */

    function getDayKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function showMessage(text) {
        timerMessage.textContent = text;
    }

    function showStorageWarning() {
        storageNote.hidden = false;

        storageNote.textContent =
            "Browser storage is unavailable. " +
            "History will remain only while this page is open.";
    }

    /* =====================================
       4. LOAD AND SAVE DATA
    ===================================== */

    function loadSavedData() {
        try {
            const savedHistory = localStorage.getItem(HISTORY_KEY);
            const parsedHistory = JSON.parse(savedHistory || "[]");

            if (Array.isArray(parsedHistory)) {
                sessionHistory = parsedHistory.filter(function (item) {
                    if (!item) {
                        return false;
                    }

                    const validMode =
                        item.mode === "focus" || item.mode === "break";

                    const validDuration =
                        Number.isInteger(item.seconds) &&
                        item.seconds > 0 &&
                        item.seconds <= 10800;

                    const validDate =
                        typeof item.finishedAt === "string" &&
                        Number.isFinite(Date.parse(item.finishedAt));

                    return validMode && validDuration && validDate;
                });
            }

            soundEnabled = localStorage.getItem(SOUND_KEY) !== "false";
        } catch (error) {
            showStorageWarning();
        }
    }

    function saveHistory() {
        try {
            const historyText = JSON.stringify(sessionHistory);

            localStorage.setItem(HISTORY_KEY, historyText);
        } catch (error) {
            showStorageWarning();
        }
    }

    /* =====================================
       5. TIME FORMATTING AND DISPLAY
    ===================================== */

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secondsLeft = seconds % 60;

        const formattedMinutes = String(minutes).padStart(2, "0");
        const formattedSeconds = String(secondsLeft).padStart(2, "0");

        return `${formattedMinutes}:${formattedSeconds}`;
    }

    function updateDisplay() {
        const formattedTime = formatTime(remainingSeconds);

        timerDisplay.textContent = formattedTime;

        const remainingRatio = remainingSeconds / totalSeconds;
        const ringOffset = ringCircumference * (1 - remainingRatio);

        progressCircle.style.strokeDashoffset = ringOffset;

        startButton.disabled = isRunning;
        pauseButton.disabled = !isRunning;

        const startLabel = startButton.querySelector("span");

        const isPaused =
            !isRunning &&
            remainingSeconds > 0 &&
            remainingSeconds < totalSeconds;

        if (isPaused) {
            startLabel.textContent = "Resume session";
        } else {
            startLabel.textContent = "Start session";
        }

        if (isRunning) {
            if (currentMode === "focus") {
                timerState.textContent = "One thing at a time";
            } else {
                timerState.textContent = "Breathe. You earned this.";
            }
        } else if (remainingSeconds === 0) {
            timerState.textContent = "Session complete";
        } else if (isPaused) {
            timerState.textContent = "Paused — take your time";
        } else {
            timerState.textContent = "Ready when you are";
        }

        if (isRunning) {
            const titleMode = currentMode === "focus" ? "Focus" : "Break";

            document.title = `${formattedTime} · ${titleMode} — Scholara`;
        } else {
            document.title = "Scholara — Focus Timer";
        }
    }

    /* =====================================
       6. INTERVAL AND COUNTDOWN
    ===================================== */

    function stopInterval() {
        clearInterval(intervalId);

        intervalId = null;
        isRunning = false;
    }

    function updateCountdown() {
        if (!isRunning) {
            return;
        }

        // A deadline avoids accumulating delays from background tabs.
        const millisecondsLeft = endTime - Date.now();

        remainingSeconds = Math.max(
            0,
            Math.ceil(millisecondsLeft / 1000)
        );

        if (remainingSeconds === 0) {
            finishSession();
        } else {
            updateDisplay();
        }
    }

    /* =====================================
       7. AUDIO
    ===================================== */

    function prepareAudio() {
        if (!soundEnabled) {
            return;
        }

        try {
            const AudioClass = window.AudioContext || window.webkitAudioContext;

            if (!AudioClass) {
                return;
            }

            if (!audioContext) {
                audioContext = new AudioClass();
            }

            if (audioContext.state === "suspended") {
                audioContext.resume().catch(function () {
                    // The on-page message still works without sound.
                });
            }
        } catch (error) {
            // Audio is optional. The timer continues normally.
        }
    }

    function playCompletionSound() {
        if (!soundEnabled || !audioContext) {
            return;
        }

        if (audioContext.state !== "running") {
            return;
        }

        try {
            const frequencies = [659.25, 830.61, 987.77];
            const currentTime = audioContext.currentTime;

            for (let index = 0; index < frequencies.length; index++) {
                const oscillator = audioContext.createOscillator();
                const gain = audioContext.createGain();
                const noteStart = currentTime + index * 0.18;

                oscillator.type = "sine";
                oscillator.frequency.value = frequencies[index];

                gain.gain.setValueAtTime(0, noteStart);
                gain.gain.linearRampToValueAtTime(0.1, noteStart + 0.025);
                gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.65);

                oscillator.connect(gain);
                gain.connect(audioContext.destination);

                oscillator.start(noteStart);
                oscillator.stop(noteStart + 0.7);

                oscillator.onended = function () {
                    oscillator.disconnect();
                    gain.disconnect();
                };
            }
        } catch (error) {
            // The completion message remains available.
        }
    }

    /* =====================================
       8. START / PAUSE / RESET
    ===================================== */

    function startTimer() {
        if (isRunning) {
            return;
        }

        if (remainingSeconds === 0) {
            remainingSeconds = totalSeconds;
        }

        prepareAudio();

        endTime = Date.now() + remainingSeconds * 1000;
        isRunning = true;
        intervalId = setInterval(updateCountdown, 250);

        if (currentMode === "focus") {
            showMessage("A quiet moment. A meaningful step forward.");
        } else {
            showMessage("Relax your shoulders. Let your mind rest.");
        }

        updateDisplay();
    }

    function pauseTimer() {
        if (!isRunning) {
            return;
        }

        updateCountdown();

        if (!isRunning) {
            return;
        }

        stopInterval();
        showMessage("Paused. Your progress is right here when you return.");
        updateDisplay();
    }

    function resetTimer() {
        stopInterval();

        remainingSeconds = totalSeconds;

        showMessage("A fresh start. You’ve got this.");
        updateDisplay();
    }

    /* =====================================
       9. MODES AND CUSTOM DURATION
    ===================================== */

    function hasUnfinishedSession() {
        return (
            isRunning ||
            (remainingSeconds > 0 && remainingSeconds < totalSeconds)
        );
    }

    function changeMode(nextMode) {
        if (nextMode === currentMode) {
            return;
        }

        if (hasUnfinishedSession()) {
            const confirmed = window.confirm(
                "Switch modes? Your unfinished session will be reset."
            );

            if (!confirmed) {
                return;
            }
        }

        stopInterval();

        currentMode = nextMode;
        totalSeconds = durations[currentMode] * 60;
        remainingSeconds = totalSeconds;
        durationInput.value = durations[currentMode];

        if (currentMode === "focus") {
            modeLabel.textContent = "TIME TO FOCUS";
            showMessage("Your next small win starts here.");
        } else {
            modeLabel.textContent = "TIME TO RECHARGE";
            showMessage("Rest is part of the process, too.");
        }

        for (const button of modeButtons) {
            const isActive = button.dataset.mode === currentMode;

            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        }

        updateDisplay();
    }

    function setCustomDuration(event) {
        event.preventDefault();

        const minutes = Number(durationInput.value);

        const isValid =
            Number.isInteger(minutes) && minutes >= 1 && minutes <= 180;

        if (!isValid) {
            showMessage("Please enter a whole number between 1 and 180 minutes.");
            return;
        }

        if (hasUnfinishedSession()) {
            const confirmed = window.confirm(
                "Apply a new duration? Your unfinished session will be reset."
            );

            if (!confirmed) {
                return;
            }
        }

        stopInterval();

        durations[currentMode] = minutes;
        totalSeconds = minutes * 60;
        remainingSeconds = totalSeconds;

        updateDisplay();
        showMessage(`${minutes} minutes, just for you. Start when you’re ready.`);
    }

    /* =====================================
       10. COMPLETE AND SAVE A SESSION
    ===================================== */

    function finishSession() {
        const completedSession = {
            mode: currentMode,
            seconds: totalSeconds,
            finishedAt: new Date(endTime).toISOString()
        };

        stopInterval();
        remainingSeconds = 0;

        sessionHistory.unshift(completedSession);

        saveHistory();
        renderHistory();
        renderTodayStats();
        updateDisplay();
        playCompletionSound();

        if (currentMode === "focus") {
            showMessage(
                "Well done! Your session is saved. " +
                "Choose Short break when you’re ready."
            );
        } else {
            showMessage(
                "Break complete. " +
                "Choose Focus whenever you’re ready to begin again."
            );
        }
    }

    /* =====================================
       11. TODAY'S STATISTICS
    ===================================== */

    function renderTodayStats() {
        const now = new Date();
        const todayKey = getDayKey(now);

        let completedFocusSessions = 0;
        let completedFocusSeconds = 0;
        let completedBreaks = 0;

        lastDay = todayKey;

        for (const session of sessionHistory) {
            const sessionDate = new Date(session.finishedAt);
            const sessionDay = getDayKey(sessionDate);

            if (sessionDay !== todayKey) {
                continue;
            }

            if (session.mode === "focus") {
                completedFocusSessions++;
                completedFocusSeconds += session.seconds;
            } else {
                completedBreaks++;
            }
        }

        todaySessions.textContent = completedFocusSessions;
        todayMinutes.textContent = Math.floor(completedFocusSeconds / 60);
        todayBreaks.textContent = completedBreaks;

        todayDate.textContent = now.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    /* =====================================
       12. HISTORY DISPLAY
    ===================================== */

    function renderEmptyHistory() {
        const emptyItem = document.createElement("li");
        emptyItem.className = "history-empty";

        const icon = document.createElement("i");
        icon.className = "ri-seedling-line";
        icon.setAttribute("aria-hidden", "true");

        const text = document.createTextNode(
            "A fresh page. Your completed sessions will appear here."
        );

        emptyItem.append(icon, text);
        historyList.append(emptyItem);
    }

    function createHistoryItem(session) {
        const item = document.createElement("li");
        item.className = "history-item";

        const detail = document.createElement("div");
        detail.className = "history-detail";

        const icon = document.createElement("i");
        icon.setAttribute("aria-hidden", "true");

        if (session.mode === "focus") {
            icon.className = "ri-checkbox-circle-line";
        } else {
            icon.className = "ri-cup-line";
        }

        const textContainer = document.createElement("div");
        const title = document.createElement("strong");

        if (session.mode === "focus") {
            title.textContent = "Focus session completed";
        } else {
            title.textContent = "Rest, well deserved";
        }

        const time = document.createElement("time");
        time.dateTime = session.finishedAt;

        time.textContent = new Date(session.finishedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

        const duration = document.createElement("span");
        duration.className = "history-duration";
        duration.textContent = `${session.seconds / 60} min`;

        textContainer.append(title, time);
        detail.append(icon, textContainer);
        item.append(detail, duration);

        return item;
    }

    function renderHistory() {
        historyList.replaceChildren();
        clearHistoryButton.disabled = sessionHistory.length === 0;

        if (sessionHistory.length === 0) {
            renderEmptyHistory();
            return;
        }

        const fragment = document.createDocumentFragment();

        for (const session of sessionHistory) {
            const item = createHistoryItem(session);
            fragment.append(item);
        }

        historyList.append(fragment);
    }

    function clearHistory() {
        if (sessionHistory.length === 0) {
            return;
        }

        const confirmed = window.confirm(
            "Delete all saved history? Today’s statistics will also reset."
        );

        if (!confirmed) {
            return;
        }

        sessionHistory = [];

        saveHistory();
        renderHistory();
        renderTodayStats();
        showMessage("Your history has been cleared. A fresh start.");
    }

    /* =====================================
       13. SOUND BUTTON
    ===================================== */

    function updateSoundButton() {
        soundButton.setAttribute("aria-pressed", String(soundEnabled));

        const icon = soundButton.querySelector("i");

        if (soundEnabled) {
            icon.className = "ri-volume-up-line";
        } else {
            icon.className = "ri-volume-mute-line";
        }
    }

    function toggleSound() {
        soundEnabled = !soundEnabled;

        try {
            localStorage.setItem(SOUND_KEY, String(soundEnabled));
        } catch (error) {
            // The preference can still be changed for this page visit.
        }

        if (soundEnabled) {
            prepareAudio();
        }

        updateSoundButton();
    }

    /* =====================================
       14. EVENTS
    ===================================== */

    startButton.addEventListener("click", startTimer);
    pauseButton.addEventListener("click", pauseTimer);
    resetButton.addEventListener("click", resetTimer);
    soundButton.addEventListener("click", toggleSound);

    clearHistoryButton.addEventListener("click", clearHistory);
    durationForm.addEventListener("submit", setCustomDuration);

    for (const button of modeButtons) {
        button.addEventListener("click", function () {
            changeMode(button.dataset.mode);
        });
    }

    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) {
            updateCountdown();
            renderTodayStats();
        }
    });

    // Refresh daily statistics after local midnight, even when idle.
    setInterval(function () {
        const currentDay = getDayKey(new Date());

        if (currentDay !== lastDay) {
            renderTodayStats();
        }
    }, 1000);

    /* =====================================
       15. INITIAL PAGE SETUP
    ===================================== */

    loadSavedData();
    updateSoundButton();
    renderHistory();
    renderTodayStats();
    updateDisplay();

})();

