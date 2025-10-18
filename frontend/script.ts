let currentUser: string | null = null;

async function register() {
    const username = (document.getElementById("username") as HTMLInputElement)?.value;
    const password = (document.getElementById("password") as HTMLInputElement)?.value;

    const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    alert(data.message);
}

async function login() {
    const username = (document.getElementById("username") as HTMLInputElement)?.value;
    const password = (document.getElementById("password") as HTMLInputElement)?.value;

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
        // Save username so main.html can greet the user
        localStorage.setItem("username", username);

        // Redirect to game page
        window.location.href = "/main.html";
    } else {
        alert(data.message);
    }

}

function logout() {
    currentUser = null;

    const loginFormElem = document.getElementById("loginForm");
    if (loginFormElem) loginFormElem.style.display = "block";

    const welcomeElem = document.getElementById("welcome");
    if (welcomeElem) welcomeElem.style.display = "none";
}

// Event Listener erst setzen, wenn DOM geladen ist
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("loginBtn")?.addEventListener("click", login);
    document.getElementById("registerBtn")?.addEventListener("click", register);
    document.getElementById("logoutBtn")?.addEventListener("click", logout);
});
