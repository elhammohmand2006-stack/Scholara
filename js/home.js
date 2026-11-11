// home page script (only this page's owner edits this file)


/* =====================================
   SCHOLARA HOME JAVASCRIPT
===================================== */


/* =====================================
   1. SELECT HTML ELEMENTS
===================================== */

const loginTab = document.getElementById("loginTab");

const signupTab = document.getElementById("signupTab");

const authForm = document.getElementById("authForm");

const fullName = document.getElementById("fullName");

const email = document.getElementById("email");

const password = document.getElementById("password");

const nameGroup = document.getElementById("nameGroup");

const formTitle = document.getElementById("formTitle");

const formDescription = document.getElementById("formDescription");

const submitButton = document.getElementById("submitButton");

const authMessage = document.getElementById("authMessage");

const rememberRow = document.getElementById("rememberRow");


/* =====================================
   2. LOGIN AND SIGNUP
===================================== */

// Default mode is Login

let currentMode = "login";


// Function to change form mode

function changeMode(mode) {

    currentMode = mode;

    authForm.reset();

    clearErrors();

    authMessage.textContent = "";

    if (mode === "signup") {

        // Show Signup

        signupTab.classList.add("active");

        loginTab.classList.remove("active");

        nameGroup.hidden = false;

        rememberRow.hidden = true;

        formTitle.textContent = "Create Account";

        formDescription.textContent =
            "Create your account and start learning.";

        submitButton.innerHTML =
            'Sign Up <i class="ri-arrow-right-line"></i>';

    }

    else {

        // Show Login

        loginTab.classList.add("active");

        signupTab.classList.remove("active");

        nameGroup.hidden = true;

        rememberRow.hidden = false;

        formTitle.textContent = "Welcome Back";

        formDescription.textContent =
            "Sign in to continue your journey.";

        submitButton.innerHTML =
            'Login <i class="ri-arrow-right-line"></i>';

    }

}


// Login button event

loginTab.addEventListener("click", function() {

    changeMode("login");

});


// Signup button event

signupTab.addEventListener("click", function() {

    changeMode("signup");

});


/* =====================================
   3. FORM VALIDATION
===================================== */


// Show error message

function showError(input, message) {

    const group = input.closest(".form-group");

    const error = group.querySelector("small");

    const box = group.querySelector(".input-box");

    error.textContent = message;

    box.classList.add("invalid");

    box.classList.remove("valid");

}


// Show success style

function showSuccess(input) {

    const group = input.closest(".form-group");

    const error = group.querySelector("small");

    const box = group.querySelector(".input-box");

    error.textContent = "";

    box.classList.remove("invalid");

    box.classList.add("valid");

}


// Clear all errors

function clearErrors() {

    document.querySelectorAll(".form-group").forEach(function(group) {

        const error = group.querySelector("small");

        const box = group.querySelector(".input-box");

        error.textContent = "";

        box.classList.remove("invalid", "valid");

    });

}


// Validate Name

function validateName() {

    const value = fullName.value.trim();

    if (value.length < 3) {

        showError(
            fullName,
            "Name must have at least 3 characters."
        );

        return false;

    }

    showSuccess(fullName);

    return true;

}


// Validate Email

function validateEmail() {

    const value = email.value.trim();

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(value)) {

        showError(
            email,
            "Please enter a valid email address."
        );

        return false;

    }

    showSuccess(email);

    return true;

}


// Validate Password

function validatePassword() {

    const value = password.value;

    if (value.length < 6) {

        showError(
            password,
            "Password must have at least 6 characters."
        );

        return false;

    }

    showSuccess(password);

    return true;

}


/* =====================================
   4. LIVE VALIDATION
===================================== */

// Check name while typing

fullName.addEventListener("input", function() {

    if (currentMode === "signup") {

        validateName();

    }

});


// Check email while typing

email.addEventListener("input", function() {

    validateEmail();

});


// Check password while typing

password.addEventListener("input", function() {

    validatePassword();

});


/* =====================================
   5. SHOW AND HIDE PASSWORD
===================================== */

const togglePassword =
    document.getElementById("togglePassword");


togglePassword.addEventListener("click", function() {

    const icon = togglePassword.querySelector("i");

    if (password.type === "password") {

        password.type = "text";

        icon.className = "ri-eye-line";

    }

    else {

        password.type = "password";

        icon.className = "ri-eye-off-line";

    }

});


/* =====================================
   6. LOCAL STORAGE
===================================== */

// Get saved user

function getUser() {

    return JSON.parse(
        localStorage.getItem("scholaraUser")
    );

}


// Show message

function showMessage(message, type) {

    authMessage.textContent = message;

    authMessage.className = type;

}


/* =====================================
   7. UPDATE USER NAME
===================================== */

function showUser(user) {

    document.getElementById("welcomeUser").hidden = false;

    document.getElementById("userName").textContent =
        user.name;

}


// Hide user name

function hideUser() {

    document.getElementById("welcomeUser").hidden = true;

}


/* =====================================
   8. SIGNUP AND LOGIN
===================================== */

authForm.addEventListener("submit", function(event) {

    event.preventDefault();

    clearErrors();

    authMessage.textContent = "";


    // Check all fields

    let isValid = validateEmail() && validatePassword();


    // Check name only in Signup

    if (currentMode === "signup") {

        isValid = validateName() && isValid;

    }


    // Stop if form is invalid

    if (!isValid) {

        showMessage(
            "Please correct the errors.",
            "error"
        );

        return;

    }


    const emailValue = email.value.trim().toLowerCase();

    const passwordValue = password.value;


    /* -------------------------
       SIGNUP
    -------------------------- */

    if (currentMode === "signup") {

        const oldUser = getUser();


        // Check existing email

        if (oldUser && oldUser.email === emailValue) {

            showError(email, "Email already exists.");

            showMessage(
                "This email is already registered.",
                "error"
            );

            return;

        }


        // Create new user object

        const newUser = {

            name: fullName.value.trim(),

            email: emailValue,

            password: passwordValue

        };


        // Save user

        localStorage.setItem(
            "scholaraUser",
            JSON.stringify(newUser)
        );


        // Change to Login

        changeMode("login");

        showMessage(
            "Account created successfully! Now login.",
            "success"
        );

        return;

    }


    /* -------------------------
       LOGIN
    -------------------------- */

    const savedUser = getUser();


    // Check if user exists

    if (!savedUser) {

        showMessage(
            "No account found. Please Sign Up first.",
            "error"
        );

        return;

    }


    // Check email and password

    if (
        emailValue === savedUser.email &&
        passwordValue === savedUser.password
    ) {

        // Save login status

        localStorage.setItem(
            "scholaraLoggedIn",
            "true"
        );


        // Remember Me

        if (document.getElementById("rememberMe").checked) {

            localStorage.setItem(
                "scholaraRemember",
                "true"
            );

        }

        else {

            localStorage.removeItem("scholaraRemember");

        }


        // Show username

        showUser(savedUser);


        // Show success message

        showMessage(
            "Login successful! Welcome to Scholara.",
            "success"
        );

    }

    else {

        showMessage(
            "Incorrect email or password.",
            "error"
        );

    }

});


/* =====================================
   9. RESTORE LOGIN
===================================== */

function checkLogin() {

    const user = getUser();

    const loggedIn =
        localStorage.getItem("scholaraLoggedIn") === "true";

    if (user && loggedIn) {

        showUser(user);

    }

    else {

        hideUser();

    }

}

checkLogin();


/* =====================================
   10. LOGOUT
===================================== */

document.getElementById("logoutBtn")
    .addEventListener("click", function() {

        localStorage.removeItem("scholaraLoggedIn");

        localStorage.removeItem("scholaraRemember");

        hideUser();

        changeMode("login");

        showMessage(
            "You have logged out successfully.",
            "success"
        );

    });


/* =====================================
   11. FORGOT PASSWORD
===================================== */

document.getElementById("forgotPassword")
    .addEventListener("click", function(event) {

        event.preventDefault();

        showMessage(
            "Password recovery is not available in this demo.",
            "error"
        );

    });


/* =====================================
   12. FEATURES ARRAY
===================================== */

// Array of Objects

const features = [

    {
        icon: "ri-checkbox-circle-line",

        title: "Tasks",

        description:
            "Organize your daily tasks and complete your goals.",

        link: "pages/tasks.html"

    },

    {
        icon: "ri-timer-line",

        title: "Study Timer",

        description:
            "Manage your study time and improve your focus.",

        link: "pages/timer.html"

    },

    {
        icon: "ri-calculator-line",

        title: "Grades",

        description:
            "Calculate and track your academic performance.",

        link: "pages/grades.html"

    },

    {
        icon: "ri-sticky-note-line",

        title: "Notes",

        description:
            "Save your important notes in one place.",

        link: "pages/notes.html"

    },

    {
        icon: "ri-calendar-check-line",

        title: "Planning",

        description:
            "Plan your daily activities and stay organized.",

        link: "pages/tasks.html"

    },

    {
        icon: "ri-trophy-line",

        title: "Achievements",

        description:
            "Celebrate your progress and reach your goals.",

        link: "pages/grades.html"

    }

];


// Get features container

const featuresContainer =
    document.getElementById("featuresContainer");


// Loop through features

features.forEach(function(feature) {

    const card = document.createElement("div");

    card.className = "feature-card glass";


    card.innerHTML = `

        <div class="feature-icon">

            <i class="${feature.icon}"></i>

        </div>

        <h3>${feature.title}</h3>

        <p>${feature.description}</p>

        <a href="${feature.link}">

            Explore More

            <i class="ri-arrow-right-line"></i>

        </a>

    `;


    // Add card to HTML

    featuresContainer.appendChild(card);

});


/* =====================================
   13. STUDY STATISTICS
===================================== */

// These keys must match your other pages.

const TASK_KEY = "studyHubTasks";

const HOURS_KEY = "studyHours";


// Get tasks

function getTasks() {

    try {

        const tasks = JSON.parse(
            localStorage.getItem(TASK_KEY)
        );

        return Array.isArray(tasks) ? tasks : [];

    }

    catch (error) {

        return [];

    }

}


// Count completed tasks

function countCompleted(tasks) {

    return tasks.filter(function(task) {

        return (
            task.completed === true ||
            task.isCompleted === true ||
            task.status === "completed" ||
            task.status === "Done"
        );

    }).length;

}


// Get study hours

function getHours() {

    const hours = Number(
        localStorage.getItem(HOURS_KEY)
    );

    return Number.isFinite(hours) && hours >= 0
        ? hours
        : 0;

}


// Update statistics

function updateStatistics() {

    const tasks = getTasks();

    const completed = countCompleted(tasks);

    const total = tasks.length;

    const hours = getHours();


    // Calculate percentage

    let percentage = 0;

    if (total > 0) {

        percentage = Math.round(
            (completed / total) * 100
        );

    }


    // Show values in HTML

    document.getElementById("completedTasks").textContent =
        completed;

    document.getElementById("studyHours").textContent =
        hours;

    document.getElementById("totalTasks").textContent =
        total;

    document.getElementById("successRate").textContent =
        percentage + "%";

}


// Run function

updateStatistics();


// Update statistics when another page changes data

window.addEventListener("storage", function(event) {

    if (
        event.key === TASK_KEY ||
        event.key === HOURS_KEY
    ) {

        updateStatistics();

    }

});


/* =====================================
   14. DAILY MOTIVATIONAL QUOTES
===================================== */

// Array of quotes

const quotes = [

    "Small progress is still progress.",

    "Believe in yourself and keep going.",

    "The secret of getting ahead is getting started.",

    "Your future depends on what you do today.",

    "Never stop learning because life never stops teaching.",

    "Dream big, work hard and stay focused.",

    "Great things take time. Keep going!",

    "Success starts with a single step.",

    "Every day is a new chance to improve.",

    "Don't give up. You are doing great!"

];


// Get quote elements

const dailyQuote = document.getElementById("dailyQuote");

const newQuote = document.getElementById("newQuote");


// Store previous quote number

let previousQuote = -1;


// Generate new quote

function generateQuote() {

    let randomNumber;


    // Avoid showing the same quote twice

    do {

        randomNumber = Math.floor(
            Math.random() * quotes.length
        );

    }

    while (
        randomNumber === previousQuote &&
        quotes.length > 1
    );


    previousQuote = randomNumber;


    // Change quote

    dailyQuote.textContent = quotes[randomNumber];

}


// Button event

newQuote.addEventListener("click", function() {

    generateQuote();

});


// Show first quote

generateQuote();


/* =====================================
   END OF HOME JAVASCRIPT
===================================== */
