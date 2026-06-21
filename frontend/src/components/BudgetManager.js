import React, { useState, useEffect, useCallback } from "react";
import "./BudgetManager.css";

const API = process.env.REACT_APP_API_URL || "";

const EXPENSE_CATEGORIES = [
  "food", "rent", "transport", "shopping", "health", "entertainment", "bills", "other",
];

const ICONS = {
  food: "🍔", rent: "🏠", transport: "🚗", shopping: "🛍️",
  health: "💊", entertainment: "🎮", bills: "📄", other: "💰",
};

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n || 0);

export default function BudgetManager({ token }) {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: "", amount: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchBudgets = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/budgets`, { headers });
      const data = await res.json();
      setBudgets(Array.isArray(data) ? data : []);
    } catch {
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  const handleSave = async () => {
    if (!form.category || !form.amount || parseFloat(form.amount) <= 0) {
      setError("Pick a category and enter a valid amount.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await fetch(`${API}/api/budgets`, {
        method: "POST",
        headers,
        body: JSON.stringify({ category: form.category, amount: parseFloat(form.amount) }),
      });
      setForm({ category: "", amount: "" });
      await fetchBudgets();
    } catch {
      setError("Failed to save budget.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    await fetch(`${API}/api/budgets/${category}`, { method: "DELETE", headers });
    await fetchBudgets();
  };

  const getStatus = (spent, budget) => {
    const pct = (spent / budget) * 100;
    if (pct >= 100) return "over";
    if (pct >= 80) return "warning";
    return "ok";
  };

  // Categories that don't have a budget yet
  const availableCategories = EXPENSE_CATEGORIES.filter(
    (c) => !budgets.find((b) => b.category === c)
  );

  return (
    <div className="budget-page">
      {/* Add Budget Form */}
      <div className="budget-form-card">
        <h3 className="budget-form-title">Set Monthly Budget</h3>
        <div className="budget-form-row">
          <select
            className="budget-select"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          >
            <option value="">Pick category…</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>{ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>

          <div className="budget-amount-wrap">
            <span className="budget-currency">﷼</span>
            <input
              type="number"
              className="budget-amount-input"
              placeholder="Amount"
              min="1"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <button className="budget-save-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Set Budget"}
          </button>
        </div>
        {error && <div className="budget-error">{error}</div>}
        {availableCategories.length === 0 && (
          <div className="budget-hint">All categories have budgets set ✅</div>
        )}
      </div>

      {/* Budget Progress List */}
      {loading ? (
        <div className="budget-loading">Loading budgets…</div>
      ) : budgets.length === 0 ? (
        <div className="budget-empty">No budgets set yet. Add one above to start tracking.</div>
      ) : (
        <div className="budget-list">
          {budgets.map((b) => {
            const pct = Math.min((parseFloat(b.spent) / parseFloat(b.budget)) * 100, 100);
            const status = getStatus(parseFloat(b.spent), parseFloat(b.budget));
            const overAmount = parseFloat(b.spent) - parseFloat(b.budget);

            return (
              <div key={b.category} className={`budget-item ${status}`}>
                <div className="budget-item-header">
                  <div className="budget-item-left">
                    <span className="budget-cat-icon">{ICONS[b.category] || "💰"}</span>
                    <div>
                      <div className="budget-cat-name">
                        {b.category.charAt(0).toUpperCase() + b.category.slice(1)}
                      </div>
                      <div className="budget-amounts">
                        <span className="spent-amt">{fmt(b.spent)}</span>
                        <span className="budget-sep"> / </span>
                        <span className="budget-amt">{fmt(b.budget)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="budget-item-right">
                    {status === "over" && (
                      <span className="budget-badge over">Over by {fmt(overAmount)}</span>
                    )}
                    {status === "warning" && (
                      <span className="budget-badge warning">⚠️ {Math.round(pct)}% used</span>
                    )}
                    {status === "ok" && (
                      <span className="budget-badge ok">{Math.round(pct)}% used</span>
                    )}
                    <button
                      className="budget-delete-btn"
                      onClick={() => handleDelete(b.category)}
                      title="Remove budget"
                    >×</button>
                  </div>
                </div>

                <div className="budget-bar-track">
                  <div
                    className={`budget-bar-fill ${status}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
