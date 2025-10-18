// Import aus Deno SQLite Modul
import { Database } from "jsr:@db/sqlite";
// Dateien für Frontend hosten
import { serveDir } from "jsr:@std/http/file-server";

// --- später aktivieren ---
// import * as bcrypt from "https://deno.land/x/bcrypt/mod.ts";

const hostname = "127.0.0.1"; // localhost
const port = 3000;

// --- Datenbank vorbereiten ---
const db = new Database("users.db");

// Users table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`).run();

// Scores table
db.prepare(`
  CREATE TABLE IF NOT EXISTS scores (
    user TEXT PRIMARY KEY,
    score INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL
  )
`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC)`).run();

// Inventory table 
db.prepare(`
  CREATE TABLE IF NOT EXISTS inventory (
    user TEXT NOT NULL,
    emoji TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (user, emoji)
  )
`).run();
db.prepare(`CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory(user)`).run();

// --- Server logic ---
Deno.serve({ hostname, port }, async (request: Request): Promise<Response> => {
  const url = new URL(request.url);

  let status = 200;
  let body: unknown = "";
  const headers = new Headers({ "Content-Type": "application/json" });

  // --- Register ---
  if (url.pathname === "/register" && request.method === "POST") {
    const { username, password } = await request.json();
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, password);
    body = { message: "Successfully registered" };
    return new Response(JSON.stringify(body), { status, headers });
  }

  // --- Login ---
  if (url.pathname === "/login" && request.method === "POST") {
    const { username, password } = await request.json();
    const rows = db.prepare("SELECT id FROM users WHERE username = ? AND password = ?").all(username, password);
    if (rows.length > 0) {
      body = { success: true, message: "Login ok" };
    } else {
      status = 401;
      body = { success: false, message: "Login failed" };
    }
    return new Response(JSON.stringify(body), { status, headers });
  }

  // --- Leaderboard ---
  if (url.pathname === "/leaderboard" && request.method === "GET") {
    const rows = db.prepare(
      "SELECT user, score FROM scores ORDER BY score DESC, updated_at ASC LIMIT 20"
    ).all();
    return new Response(JSON.stringify(rows), { status: 200, headers });
  }

  // --- Submit score ---
  if (url.pathname === "/score" && request.method === "POST") {
    try {
      const { username, score } = await request.json();
      const user = String(username ?? "Guest").slice(0, 32);
      const s = Math.max(0, Number(score) || 0);
      const now = new Date().toISOString();

      db.prepare(`
        INSERT INTO scores (user, score, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user) DO UPDATE SET
          score = CASE WHEN excluded.score > scores.score THEN excluded.score ELSE scores.score END,
          updated_at = CASE WHEN excluded.score > scores.score THEN excluded.updated_at ELSE scores.updated_at END
      `).run(user, s, now);

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Bad request" }), { status: 400, headers });
    }
  }

  // --- Get inventory ---
  if (url.pathname === "/inventory" && request.method === "GET") {
    const user = url.searchParams.get("user") ?? "Guest";
    const rows = db.prepare(
      "SELECT emoji, count FROM inventory WHERE user = ? ORDER BY count DESC"
    ).all(user);
    return new Response(JSON.stringify(rows), { status: 200, headers });
  }

  // --- Roll reward ---
  if (url.pathname === "/reward" && request.method === "POST") {
    try {
      const { username } = await request.json();
      const user = String(username ?? "Guest").slice(0, 32);

      // Loot table with % chances 
      const pool: Array<{ emoji: string; chance: number }> = [
        { emoji: "🍎", chance: 50 }, // Common
        { emoji: "🍪", chance: 25 }, // Uncommon
        { emoji: "💎", chance: 10 }, // Rare
        { emoji: "🐉", chance: 1 },  // Legendary
      ];

      const roll = Math.random() * 100;
      let cumulative = 0;
      let reward: string | null = null;
      for (const item of pool) {
        cumulative += item.chance;
        if (roll <= cumulative) {
          reward = item.emoji;
          break;
        }
      }

      // If nothing hit due to rounding, fallback to the last common item
      if (!reward) reward = pool[0].emoji;

      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO inventory (user, emoji, count, updated_at)
        VALUES (?, ?, 1, ?)
        ON CONFLICT(user, emoji) DO UPDATE SET
          count = count + 1,
          updated_at = excluded.updated_at
      `).run(user, reward, now);

      return new Response(JSON.stringify({ reward }), { status: 200, headers });
    } catch {
      return new Response(JSON.stringify({ error: "Bad request" }), { status: 400, headers });
    }
  }

  // --- Fileserver für ./frontend ---
  return serveDir(request, {
    fsRoot: "./frontend",
    urlRoot: "",
    showDirListing: true,   // nützlich beim Entwickeln
    enableCors: true,       // praktisch für lokale Tests
  });
});

console.log(`Server läuft auf http://${hostname}:${port}/`);
