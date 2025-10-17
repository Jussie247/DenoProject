"use strict";
let currentUser = null;
async function register() {
    var _a, _b;
    const username = (_a = document.getElementById("username")) === null || _a === void 0 ? void 0 : _a.value;
    const password = (_b = document.getElementById("password")) === null || _b === void 0 ? void 0 : _b.value;
    const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    alert(data.message);
}
async function login() {
    var _a, _b;
    const username = (_a = document.getElementById("username")) === null || _a === void 0 ? void 0 : _a.value;
    const password = (_b = document.getElementById("password")) === null || _b === void 0 ? void 0 : _b.value;
    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
        const data = await res.json();
        alert(data.message);
        return;
    }
    const data = await res.json();
    if (data.success) {
        currentUser = username;
        const greetingElem = document.getElementById("greeting");
        if (greetingElem)
            greetingElem.innerText = "Hello " + currentUser;
        const loginFormElem = document.getElementById("loginForm");
        if (loginFormElem)
            loginFormElem.style.display = "none";
        const welcomeElem = document.getElementById("welcome");
        if (welcomeElem)
            welcomeElem.style.display = "block";
    }
    else {
        alert(data.message);
    }
}
function logout() {
    currentUser = null;
    const loginFormElem = document.getElementById("loginForm");
    if (loginFormElem)
        loginFormElem.style.display = "block";
    const welcomeElem = document.getElementById("welcome");
    if (welcomeElem)
        welcomeElem.style.display = "none";
}
// Event Listener erst setzen, wenn DOM geladen ist
document.addEventListener("DOMContentLoaded", () => {
    var _a, _b, _c;
    (_a = document.getElementById("loginBtn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", login);
    (_b = document.getElementById("registerBtn")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", register);
    (_c = document.getElementById("logoutBtn")) === null || _c === void 0 ? void 0 : _c.addEventListener("click", logout);
});
