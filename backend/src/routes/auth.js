const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

// ─── Helper: sanitize username ────────────────────────────────────────────────
// بنسمح بحروف وأرقام و underscore بس — عشان نستخدمه كـ DB name آمن
function sanitizeUsername(username) {
  return username.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const cleanUsername = sanitizeUsername(username);
  if (cleanUsername.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters (letters/numbers only)" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const authPool = req.app.locals.authPool;
  const baseConfig = req.app.locals.baseConfig;

  // ─── 1. تأكد إن اليوزر مش موجود ───────────────────────────────────────────
  const existing = await authPool.query("SELECT id FROM users WHERE username = $1", [cleanUsername]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: "Username already taken" });
  }

  // ─── 2. Hash الباسورد ──────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(password, 10);

  // ─── 3. احفظ اليوزر ───────────────────────────────────────────────────────
  await authPool.query(
    "INSERT INTO users (username, password) VALUES ($1, $2)",
    [cleanUsername, hashedPassword]
  );

  // ─── 4. انشئ Database باسم اليوزر ─────────────────────────────────────────
  // لازم نستخدم postgres DB (مش auth_db) عشان CREATE DATABASE مش بتتنفذ جوا transaction
  const adminPool = new Pool({ ...baseConfig, database: "auth_db" });
  const adminClient = await adminPool.connect();

  try {
    const dbName = `finance_${cleanUsername}`;
    // CREATE DATABASE مش بتشتغل في transaction — لازم autocommit
    await adminClient.query(`CREATE DATABASE "${dbName}" OWNER "${baseConfig.user}"`);

    // ─── 5. انشئ الـ transactions table جوا الـ DB الجديدة ──────────────────
    const userPool = new Pool({ ...baseConfig, database: dbName });
    const userClient = await userPool.connect();
    try {
      await userClient.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id          SERIAL PRIMARY KEY,
          type        VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
          category    VARCHAR(50) NOT NULL,
          amount      DECIMAL(12, 2) NOT NULL,
          description TEXT,
          date        DATE NOT NULL DEFAULT CURRENT_DATE,
          created_at  TIMESTAMP DEFAULT NOW()
        );
      `);
    } finally {
      userClient.release();
      await userPool.end();
    }
  } catch (dbErr) {
    // لو الـ DB اتنشأت قبل كده (edge case) — مش مشكلة، نكمل
    if (!dbErr.message.includes("already exists")) {
      console.error("DB creation error:", dbErr.message);
      return res.status(500).json({ error: "Failed to create user database" });
    }
  } finally {
    adminClient.release();
    await adminPool.end();
  }

  // ─── 6. ارجع JWT Token ─────────────────────────────────────────────────────
  const token = jwt.sign(
    { username: cleanUsername },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );

  res.status(201).json({ token, username: cleanUsername });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  const cleanUsername = sanitizeUsername(username);
  const authPool = req.app.locals.authPool;

  const result = await authPool.query("SELECT * FROM users WHERE username = $1", [cleanUsername]);
  if (result.rows.length === 0) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const user = result.rows[0];
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = jwt.sign(
    { username: cleanUsername },
    process.env.JWT_SECRET || "secret",
    { expiresIn: "7d" }
  );

  res.json({ token, username: cleanUsername });
});

module.exports = router;
