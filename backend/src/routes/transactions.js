const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

// كل الـ routes محتاجة token صحيح
router.use(authMiddleware);

// ─── GET /api/transactions ────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const pool = req.app.locals.getUserPool(req.username);
  try {
    const { type, limit = 50 } = req.query;
    let query = "SELECT * FROM transactions";
    const params = [];

    if (type) {
      query += " WHERE type = $1";
      params.push(type);
    }

    query += " ORDER BY date DESC, created_at DESC LIMIT $" + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
});

// ─── POST /api/transactions ───────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const pool = req.app.locals.getUserPool(req.username);
  try {
    const { type, category, amount, description, date } = req.body;

    if (!type || !category || !amount) {
      return res.status(400).json({ error: "type, category, and amount are required" });
    }

    const result = await pool.query(
      `INSERT INTO transactions (type, category, amount, description, date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [type, category, parseFloat(amount), description || "", date || new Date().toISOString().split("T")[0]]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
});

// ─── DELETE /api/transactions/:id ────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  const pool = req.app.locals.getUserPool(req.username);
  try {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM transactions WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({ message: "Deleted", transaction: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    await pool.end();
  }
});

module.exports = router;
