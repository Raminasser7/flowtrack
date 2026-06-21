const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// ─── Helper: create budgets table if not exists ───────────────────────────────
async function ensureBudgetsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      id          SERIAL PRIMARY KEY,
      category    VARCHAR(50) UNIQUE NOT NULL,
      amount      DECIMAL(12, 2) NOT NULL,
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    );
  `);
}

// ─── GET /api/budgets ─────────────────────────────────────────────────────────
// بيرجع كل الـ budgets + spent amount للشهر الحالي لكل category
router.get("/", async (req, res) => {
  const pool = req.app.locals.getUserPool(req.username);
  try {
    await ensureBudgetsTable(pool);

    const result = await pool.query(`
      SELECT
        b.id,
        b.category,
        b.amount AS budget,
        COALESCE(SUM(t.amount), 0) AS spent
      FROM budgets b
      LEFT JOIN transactions t
        ON t.category = b.category
        AND t.type = 'expense'
        AND DATE_TRUNC('month', t.date) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY b.id, b.category, b.amount
      ORDER BY b.category
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
});

// ─── POST /api/budgets ────────────────────────────────────────────────────────
// ينشئ أو يحدّث budget لـ category معينة (upsert)
router.post("/", async (req, res) => {
  const pool = req.app.locals.getUserPool(req.username);
  try {
    await ensureBudgetsTable(pool);

    const { category, amount } = req.body;
    if (!category || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "category and a positive amount are required" });
    }

    const result = await pool.query(`
      INSERT INTO budgets (category, amount, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (category)
      DO UPDATE SET amount = EXCLUDED.amount, updated_at = NOW()
      RETURNING *
    `, [category, parseFloat(amount)]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
});

// ─── DELETE /api/budgets/:category ───────────────────────────────────────────
router.delete("/:category", async (req, res) => {
  const pool = req.app.locals.getUserPool(req.username);
  try {
    await ensureBudgetsTable(pool);
    const { category } = req.params;
    await pool.query("DELETE FROM budgets WHERE category = $1", [category]);
    res.json({ message: "Budget removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
});

module.exports = router;
