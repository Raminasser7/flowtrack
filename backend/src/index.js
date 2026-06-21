const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Base DB Config (بيتشارك بين كل الـ connections) ───────────────────────
const baseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
};

// ─── Auth DB Pool (للـ users table) ────────────────────────────────────────
const authPool = new Pool({
  ...baseConfig,
  database: process.env.AUTH_DB || "auth_db",
});

// ─── Dynamic Pool: بياخد username وبيرجع pool على DB بتاعته ───────────────
function getUserPool(username) {
  return new Pool({
    ...baseConfig,
    database: `finance_${username}`,
  });
}

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// بنحط authPool و getUserPool على app.locals عشان الـ routes تقدر تستخدمهم
app.locals.authPool = authPool;
app.locals.getUserPool = getUserPool;
app.locals.baseConfig = baseConfig;

// ─── Init Auth DB ────────────────────────────────────────────────────────────
async function initAuthDB() {
  const client = await authPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id        SERIAL PRIMARY KEY,
        username  VARCHAR(50) UNIQUE NOT NULL,
        password  TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("✅ Auth DB ready");
  } finally {
    client.release();
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRouter = require("./routes/auth");
const transactionsRouter = require("./routes/transactions");

app.use("/api/auth", authRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/summary", require("./routes/summary"));
app.use("/api/budgets", require("./routes/budgets"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Start ───────────────────────────────────────────────────────────────────
initAuthDB()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ DB init failed:", err.message);
    process.exit(1);
  });
