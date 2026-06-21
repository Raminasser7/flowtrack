const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

// ─── GET /api/summary ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const pool = req.app.locals.getUserPool(req.username);
  try {
    const result = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) AS balance
      FROM transactions
    `);

    const byCategory = await pool.query(`
      SELECT category, type, SUM(amount) as total
      FROM transactions
      GROUP BY category, type
      ORDER BY total DESC
      LIMIT 6
    `);

    res.json({
      summary: result.rows[0],
      byCategory: byCategory.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
});

module.exports = router;
