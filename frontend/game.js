"use strict";
document.addEventListener("DOMContentLoaded", () => {
    const hello = document.getElementById("hello");
    const countEl = document.getElementById("count");
    const resetBtn = document.getElementById("reset");
    const cookie = document.getElementById("cookie");
    const lbList = document.getElementById("lb-list");
    const backpack = document.getElementById("backpack");
    const inventoryDiv = document.getElementById("inventory");
    const bpIndicator = document.getElementById("bp-indicator");
    const inventoryItems = document.getElementById("inventory-items");
    // greet
    const username = localStorage.getItem("username") || "";
    hello.textContent = username ? `Hello, ${username}!` : "Welcome, Guest";
    // per-user keys
    const clicksKey = username ? `clicks:${username}` : "clicks:guest";
    const highKey = username ? `highscore:${username}` : "highscore:guest";
    // load local state
    let clicks = Number(localStorage.getItem(clicksKey) || 0);
    let high = Number(localStorage.getItem(highKey) || 0);
    countEl.textContent = String(clicks);
    const saveClicks = () => localStorage.setItem(clicksKey, String(clicks));
    const saveHigh = () => localStorage.setItem(highKey, String(high));
    // --- Leaderboard helpers ---
    async function fetchLeaderboard() {
        try {
            const res = await fetch("/leaderboard");
            if (!res.ok)
                return;
            const rows = await res.json();
            lbList.innerHTML = "";
            rows.forEach((r) => {
                const li = document.createElement("li");
                li.textContent = `${r.user}: ${r.score}`;
                lbList.appendChild(li);
            });
        }
        catch ( /* ignore */_a) { /* ignore */ }
    }
    async function submitHighScore(newHigh) {
        try {
            await fetch("/score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username || "Guest", score: newHigh }),
            });
            fetchLeaderboard();
        }
        catch ( /* ignore */_a) { /* ignore */ }
    }
    // initial board
    fetchLeaderboard();
    // reward counter
    let clickCounter = 0;
    // clicks
    cookie.addEventListener("click", async () => {
        clicks++;
        clickCounter++;
        countEl.textContent = String(clicks);
        saveClicks();
        if (clicks > high) {
            high = clicks;
            saveHigh();
            submitHighScore(high);
        }
        // every 10 clicks = chance for reward
        if (clickCounter >= 10) {
            clickCounter = 0;
            const res = await fetch("/reward", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username })
            });
            const data = await res.json();
            if (data.reward) {
                bpIndicator.style.display = "block"; // red dot
            }
        }
        cookie.classList.remove("pop");
        void cookie.offsetWidth; // restart animation
        cookie.classList.add("pop");
    });
    // reset button resets only current score
    resetBtn.addEventListener("click", () => {
        clicks = 0;
        countEl.textContent = "0";
        saveClicks();
    });
    // Backpack toggle
    backpack.addEventListener("click", async () => {
        if (inventoryDiv.classList.contains("hidden")) {
            const res = await fetch(`/inventory?user=${username}`);
            const items = await res.json();
            inventoryItems.innerHTML = "";
            items.forEach((it) => {
                const div = document.createElement("div");
                div.style.display = "inline-block";
                div.style.position = "relative";
                div.style.marginRight = "10px";
                div.style.fontSize = "1.8rem";
                // emoji itself
                const emoji = document.createElement("span");
                emoji.textContent = it.emoji;
                div.appendChild(emoji);
                // stack count
                if (it.count > 1) {
                    const badge = document.createElement("span");
                    badge.textContent = String(it.count);
                    badge.className = "count-badge"; // use CSS class
                    div.appendChild(badge);
                }
                inventoryItems.appendChild(div);
            });
            bpIndicator.style.display = "none"; // reset indicator
            inventoryDiv.classList.remove("hidden");
        }
        else {
            inventoryDiv.classList.add("hidden");
        }
    });
});
