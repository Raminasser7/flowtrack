import React, { useState } from "react";
import "./AddTransaction.css";

const INCOME_CATEGORIES = ["salary", "freelance", "investment", "gift", "other"];
const EXPENSE_CATEGORIES = ["food", "rent", "transport", "shopping", "health", "entertainment", "bills", "other"];

const ICONS = {
  salary: "💼", freelance: "💻", investment: "📈", gift: "🎁",
  food: "🍔", rent: "🏠", transport: "🚗", shopping: "🛍️",
  health: "💊", entertainment: "🎮", bills: "📄", other: "💰",
};

export default function AddTransaction({ onAdd, onSuccess }) {
  const [type, setType] = useState("expense");
  const [form, setForm] = useState({ category: "", amount: "", description: "", date: new Date().toISOString().split("T")[0] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async () => {
    if (!form.category || !form.amount) {
      setError("Please fill in category and amount.");
      return;
    }
    if (parseFloat(form.amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onAdd({ ...form, type });
      setForm({ category: "", amount: "", description: "", date: new Date().toISOString().split("T")[0] });
      onSuccess();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-page">
      <div className="add-card">
        <h2 className="add-title">New Transaction</h2>

        {/* Type Toggle */}
        <div className="type-toggle">
          <button
            className={`toggle-btn ${type === "expense" ? "active expense-active" : ""}`}
            onClick={() => { setType("expense"); setForm(f => ({ ...f, category: "" })); }}
          >
            ↓ Expense
          </button>
          <button
            className={`toggle-btn ${type === "income" ? "active income-active" : ""}`}
            onClick={() => { setType("income"); setForm(f => ({ ...f, category: "" })); }}
          >
            ↑ Income
          </button>
        </div>

        {/* Amount */}
        <div className="field">
          <label className="field-label">Amount (SAR)</label>
          <div className="amount-input-wrap">
            <span className="currency-symbol">﷼</span>
            <input
              type="number"
              className="amount-input"
              placeholder="0.00"
              value={form.amount}
              min="0"
              step="0.01"
              onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
            />
          </div>
        </div>

        {/* Category Grid */}
        <div className="field">
          <label className="field-label">Category</label>
          <div className="category-grid">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`cat-btn ${form.category === cat ? "selected" : ""}`}
                onClick={() => setForm(f => ({ ...f, category: cat }))}
              >
                <span>{ICONS[cat]}</span>
                <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="field">
          <label className="field-label">Description (optional)</label>
          <input
            type="text"
            className="text-input"
            placeholder="What was this for?"
            value={form.description}
            onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        {/* Date */}
        <div className="field">
          <label className="field-label">Date</label>
          <input
            type="date"
            className="text-input"
            value={form.date}
            onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button className={`submit-btn ${type}`} onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Saving..." : `Save ${type === "income" ? "Income" : "Expense"}`}
        </button>
      </div>
    </div>
  );
}
