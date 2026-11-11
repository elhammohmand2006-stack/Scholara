// home page script (only this page's owner edits this file)

/* ===================================
   STUDYHUB - JAVASCRIPT
=================================== */


/* ===================================
   1. SELECT HTML ELEMENTS
=================================== */

const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");

const authForm = document.getElementById("authForm");

const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const submitButton = document.getElementById("submitButton");

const nameGroup = document.getElementById("nameGroup");
const rememberRow = document.getElementById("rememberRow");

const fullName = document.getElementById("fullName");
const email = document.getElementById("email");
const password = document.getElementById("password");

const authMessage = document.getElementById("authMessage");

const navUsername = document.getElementById("navUsername");
const userAvatar = document.getElementById("userAvatar");


/* ===================================
   2. AUTHENTICATION MODE
=================================== */

// Current mode: login or signup

let currentMode = "login";


// Switch between Login and Signup

function switchMode(mode) {

    currentMode = mode;

    authMessage.textContent = "";
    authMessage.className = "auth-message";

    clearErrors();

    if (mode === "signup") {

        loginTab.classList.remove("active");
        signupTab.classList.add("active");

        nameGroup.hidden = false;
        rememberRow.hidden = true;

        authTitle.textContent = "Create Account";

        authSubtitle.textContent =
            "Join StudyHub and start learning";

        submitButton.innerHTML =
            'Sign Up <span>→</span>';

        fullName.required = true;
        password.autocomplete = "new-password";

    } else {

        signupTab.classList.remove("active");
        loginTab.classList.add("active");

        nameGroup.hidden = true;
        rememberRow.hidden = false;

        authTitle.textContent = "Welcome Back!";

        authSubtitle.textContent =
            "Sign in to continue your journey";

        submitButton.innerHTML =
            'Login <span>→</span>';

        fullName.required = false;
        password.autocomplete = "current-password";
    }

    authForm.reset();
}


// Tab click events

loginTab.addEventListener("click", function () {
    switchMode("login");
});

signupTab.addEventListener("click", function () {
    switchMode("signup");
});


/* ===================================
   3. FORM VALIDATION
=================================== */

function showError(input, errorId, message) {

    const errorElement = document.getElementById(errorId);

    errorElement.textContent = message;

    input.classList.add("invalid");
    input.classList.remove("valid");
}


function showSuccess(input, errorId) {

    const errorElement = document.getElementById(errorId);

    errorElement.textContent = "";

    input.classList.remove("invalid");
    input.classList.add("valid");
}


function clearErrors() {

    const inputs = [
        fullName,
        email,
        password
    ];

    const errors = [
        "nameError",
        "emailError",
        "passwordError"
    ];

    inputs.forEach(function(input, index) {

        input.classList.remove("invalid", "valid");

        document.getElementById(errors[index]).textContent = "";

    });
}


// Validate full name

function validateName() {

    const nameValue = fullName.value.trim();

    if (nameValue.length < 3) {

        showError(
            fullName,
            "nameError",
            "Name must contain at least 3 characters."
        );

        return false;
    }

    showSuccess(fullName, "nameError");

    return true;
}


// Validate email

function validateEmail() {

    const emailValue = email.value.trim();

    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(emailValue)) {

        showError(
            email,
            "emailError",
            "Please enter a valid email address."
        );

        return false;
    }

    showSuccess(email, "emailError");

    return true;
}


// Validate password

function validatePassword() {

    const passwordValue = password.value;

    if (passwordValue.length < 6) {

        showError(
            password,
            "passwordError",
            "Password must contain at least 6 characters."
        );

        return false;
    }

    showSuccess(password, "passwordError");

    return true;
}


// Live validation events

fullName.addEventListener("input", function() {

    if (currentMode === "signup") {
        validateName();
    }

});

email.addEventListener("input", validateEmail);

password.addEventListener("input", validatePassword);


/* ===================================
   4. SHOW / HIDE PASSWORD
=================================== */

const togglePassword =
    document.getElementById("togglePassword");

togglePassword.addEventListener("click", function() {

    if (password.type === "password") {

        password.type = "text";

        togglePassword.textContent = "🙈";

    } else {

        password.type = "password";

        togglePassword.textContent = "👁";
    }

});


/* ===================================
   5. SIGN UP AND LOGIN
=================================== */

// Demo account storage

function getSavedUser() {

    return JSON.parse(
        localStorage.getItem("studyHubUser")
    ) || null;

}


function saveUser(user) {

    localStorage.setItem(
        "studyHubUser",
        JSON.stringify(user)
    );

}


// Update Navbar after login

function updateNavbar(user) {

    navUsername.textContent = user.name;

    userAvatar.textContent =
        user.name.charAt(0).toUpperCase();

}


// Form Submit Event

authForm.addEventListener("submit", function(event) {

    event.preventDefault();

    authMessage.textContent = "";
    authMessage.className = "auth-message";

    let isValid = validateEmail() && validatePassword();

    if (currentMode === "signup") {

        isValid = validateName() && isValid;

    }

    if (!isValid) {

        authMessage.textContent =
            "Please correct the errors above.";

        authMessage.classList.add("error");

        return;
    }


    const emailValue = email.value.trim().toLowerCase();

    const passwordValue = password.value;


    // SIGN UP

    if (currentMode === "signup") {

        const user = {

            name: fullName.value.trim(),

            email: emailValue,

            password: passwordValue

        };


        saveUser(user);

        authMessage.textContent =
            "Account created successfully!";

        authMessage.classList.add("success");

        updateNavbar(user);

        localStorage.setItem(
            "studyHubLoggedIn",
            "true"
        );

        authForm.reset();

        switchMode("login");

        authMessage.textContent =
            "Welcome! Your account has been created.";

        authMessage.classList.add("success");

        return;
    }


    // LOGIN

    const savedUser = getSavedUser();

    if (!savedUser) {

        authMessage.textContent =
            "No account found. Please sign up first.";

        authMessage.classList.add("error");

        return;
    }


    if (
        emailValue === savedUser.email &&
        passwordValue === savedUser.password
    ) {

        authMessage.textContent =
            "Login successful! Welcome to StudyHub.";

        authMessage.classList.add("success");

        updateNavbar(savedUser);

        localStorage.setItem(
            "studyHubLoggedIn",
            "true"
        );

        if (
            document.getElementById("rememberMe").checked
        ) {

            localStorage.setItem(
                "studyHubRemember",
                "true"
            );

        } else {

            localStorage.removeItem(
                "studyHubRemember"
            );

        }

    } else {

        authMessage.textContent =
            "Incorrect email or password.";

        authMessage.classList.add("error");

    }

});


/* ===================================
   6. FORGOT PASSWORD
=================================== */

document.getElementById("forgotPassword")
    .addEventListener("click", function(event) {

        event.preventDefault();

        const savedUser = getSavedUser();

        if (!savedUser) {

            alert("Please create an account first.");

            return;
        }

        alert(
            "Password reset requires an email service or backend."
        );

    });


/* ===================================
   7. FEATURES ARRAY OF OBJECTS
=================================== */

const features = [

    {
        icon: "📝",
        title: "Task Management",
        description:
            "Create, organize and manage your daily tasks easily.",
        link: "tasks.html",
        button: "Manage Tasks"
    },

    {
        icon: "⏱️",
        title: "Study Timer",
        description:
            "Track your study sessions and improve your focus.",
        link: "timer.html",
        button: "Start Studying"
    },

    {
        icon: "📊",
        title: "Grades & Progress",
        description:
            "Check your academic performance and achievements.",
        link: "grades.html",
        button: "View Grades"
    },

    {
        icon: "📚",
        title: "Study Notes",
        description:
            "Save your important notes and learning materials.",
        link: "notes.html",
        button: "Open Notes"
    },

    {
        icon: "🎯",
        title: "Daily Goals",
        description:
            "Set personal learning goals and complete them.",
        link: "goals.html",
        button: "Set Goals"
    },

    {
        icon: "🏆",
        title: "Achievements",
        description:
            "Celebrate your progress and stay motivated.",
        link: "achievements.html",
        button: "View Awards"
    }

];


// Generate feature cards using forEach

const featuresContainer =
    document.getElementById("featuresContainer");


features.forEach(function(feature) {

    const card = document.createElement("div");

    card.className = "feature-card glass";

    card.innerHTML = `

        <div class="feature-icon">
            ${feature.icon}
        </div>

        <h3>${feature.title}</h3>

        <p>${feature.description}</p>

        <a href="${feature.link}" class="feature-link">
            ${feature.button} →
        </a>

    `;

    featuresContainer.appendChild(card);

});


/* ===================================
   8. STATISTICS
=================================== */

/*
  IMPORTANT:
  Change these keys if your other pages
  use different localStorage names.
*/

const STORAGE_KEYS = {

    tasks: "studyHubTasks",

    hours: "studyHours"

};


// Read tasks from localStorage

function getTasks() {

    return JSON.parse(
        localStorage.getItem(STORAGE_KEYS.tasks)
    ) || [];

}


// Calculate completed tasks

function getCompletedTasks(tasks) {

    return tasks.filter(function(task) {

        return (
            task.completed === true ||
            task.status === "completed" ||
            task.status === "Done"
        );

    }).length;

}


// Calculate study hours

function getStudyHours() {

    const hours = Number(
        localStorage.getItem(STORAGE_KEYS.hours)
    );

    return Number.isFinite(hours) ? hours : 0;

}


// Update statistics on Home page

function updateStatistics() {

    const tasks = getTasks();

    const completed = getCompletedTasks(tasks);

    const total = tasks.length;

    const hours = getStudyHours();

    const successRate = total > 0
        ? Math.round((completed / total) * 100)
        : 0;


    // Update statistics cards

    document.getElementById("completedTasks")
        .textContent = completed;

    document.getElementById("studyHours")
        .textContent = hours;

    document.getElementById("totalTasks")
        .textContent = total;

    document.getElementById("successRate")
        .textContent = successRate + "%";


    // Update hero statistics

    document.getElementById("heroTasks")
        .textContent = completed;

    document.getElementById("heroHours")
        .textContent = hours;

}


// Run statistics

updateStatistics();


/* ===================================
   9. DAILY MOTIVATIONAL QUOTES
=================================== */

const quotes = [

    "The secret of getting ahead is getting started.",

    "Success is the sum of small efforts repeated daily.",

    "Believe you can and you're halfway there.",

    "Don't stop when you're tired. Stop when you're done.",

    "Learning never exhausts the mind.",

    "Your future is created by what you do today.",

    "Great things take time. Keep going!",

    "Dream big, work hard and stay focused.",

    "Small progress is still progress.",

    "Every expert was once a beginner."

];


const dailyQuote =
    document.getElementById("dailyQuote");

const newQuote =
    document.getElementById("newQuote");


// Generate a random quote

function generateQuote() {

    const randomIndex =
        Math.floor(Math.random() * quotes.length);

    dailyQuote.style.opacity = "0";

    setTimeout(function() {

        dailyQuote.textContent =
            quotes[randomIndex];

        dailyQuote.style.opacity = "1";

    }, 200);

}


// New quote button event

newQuote.addEventListener("click", generateQuote);


/* ===================================
   10. RESTORE LOGIN SESSION
=================================== */

function restoreSession() {

    const savedUser = getSavedUser();

    const isLoggedIn =
        localStorage.getItem("studyHubLoggedIn") === "true";

    const remember =
        localStorage.getItem("studyHubRemember") === "true";

    if (savedUser && isLoggedIn) {

        updateNavbar(savedUser);

        if (remember) {

            authMessage.textContent =
                "You are already logged in.";

            authMessage.classList.add("success");

        }

    }

}


restoreSession();

const STORAGE_KEYS = {
    tasks: "studyHubTasks",
    hours: "studyHours"
};