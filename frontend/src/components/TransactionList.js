import React, { useState } from "react";
import "./TransactionList.css";

const ICONS = {
  salary: "💼", freelance: "💻", investment: "📈", gift: "🎁",
  food: "🍔", rent: "🏠", transport: "🚗", shopping: "🛍️",
  health: "💊", entertainment: "🎮", bills: "📄", other: "💰",
};

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n || 0);

export default function TransactionList({ transactions, onDelete }) {
  const [filter, setFilter] = useState("all");
  const [deleting, setDeleting] = useState(null);

  const filtered = transactions.filter((t) => filter === "all" || t.type === filter);

  const handleDelete = async (id) => {
    setDeleting(id);
    await onDelete(id);
    setDeleting(null);
  };

  return (
    <div className="list-page">
      <div className="list-header">
        <h2 className="list-title">Transaction History</h2>
        <div className="filter-tabs">
          {["all", "income", "expense"].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""} ${f}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="list-empty">No {filter === "all" ? "" : filter} transactions found.</div>
      ) : (
        <div className="tx-list">
          {filtered.map((tx) => (
            <div key={tx.id} className={`tx-row ${tx.type}`}>
              <div className="tx-left">
                <span className="tx-icon-big">{ICONS[tx.category] || "💳"}</span>
                <div className="tx-details">
                  <span className="tx-cat">{tx.category.charAt(0).toUpperCase() + tx.category.slice(1)}</span>
                  <span className="tx-desc-small">{tx.description || "—"}</span>
                </div>
              </div>
              <div className="tx-right">
                <span className={`tx-amount-big ${tx.type}`}>
                  {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                </span>
                <span className="tx-date-small">
                  {new Date(tx.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <button
                className="delete-btn"
                onClick={() => handleDelete(tx.id)}
                disabled={deleting === tx.id}
                title="Delete"
              >
                {deleting === tx.id ? "…" : "×"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
