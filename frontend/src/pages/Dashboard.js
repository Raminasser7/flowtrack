import React from "react";
import "./Dashboard.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n || 0);

const CATEGORY_ICONS = {
  salary: "💼", freelance: "💻", investment: "📈", gift: "🎁", other: "💰",
  food: "🍔", rent: "🏠", transport: "🚗", shopping: "🛍️", health: "💊",
  entertainment: "🎮", bills: "📄",
};

export default function Dashboard({ summary, transactions }) {
  const balance = parseFloat(summary?.balance || 0);
  const income = parseFloat(summary?.total_income || 0);
  const expense = parseFloat(summary?.total_expense || 0);
  const incomeWidth = income + expense > 0 ? (income / (income + expense)) * 100 : 50;

  // Last 7 days bar chart data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en", { weekday: "short" });
    const dayTx = transactions.filter((t) => t.date?.slice(0, 10) === key);
    const inc = dayTx.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
    const exp = dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);
    return { label, inc, exp };
  });

  const maxVal = Math.max(...last7.map((d) => Math.max(d.inc, d.exp)), 1);

  const recent = [...transactions].slice(0, 5);

  return (
    <div className="dashboard">
      {/* Summary Cards */}
      <div className="cards-row">
        <div className={`card balance-card ${balance >= 0 ? "positive" : "negative"}`}>
          <div className="card-label">Net Balance</div>
          <div className="card-amount balance-amount">{fmt(balance)}</div>
          <div className="balance-bar">
            <div className="bar-income" style={{ width: `${incomeWidth}%` }} />
          </div>
          <div className="balance-bar-labels">
            <span style={{ color: "var(--income)" }}>Income</span>
            <span style={{ color: "var(--expense)" }}>Expense</span>
          </div>
        </div>

        <div className="card income-card">
          <div className="card-label">Total Income</div>
          <div className="card-amount income-amount">{fmt(income)}</div>
          <div className="card-badge income-badge">↑ This period</div>
        </div>

        <div className="card expense-card">
          <div className="card-label">Total Expenses</div>
          <div className="card-amount expense-amount">{fmt(expense)}</div>
          <div className="card-badge expense-badge">↓ This period</div>
        </div>
      </div>

      <div className="bottom-row">
        {/* 7-Day Chart */}
        <div className="card chart-card">
          <div className="section-title">Last 7 Days</div>
          <div className="bar-chart">
            {last7.map((day, i) => (
              <div key={i} className="bar-col">
                <div className="bars">
                  <div
                    className="bar bar-i"
                    style={{ height: `${(day.inc / maxVal) * 100}%` }}
                    title={`Income: ${fmt(day.inc)}`}
                  />
                  <div
                    className="bar bar-e"
                    style={{ height: `${(day.exp / maxVal) * 100}%` }}
                    title={`Expense: ${fmt(day.exp)}`}
                  />
                </div>
                <div className="bar-label">{day.label}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><span className="dot dot-income" />Income</span>
            <span><span className="dot dot-expense" />Expense</span>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card recent-card">
          <div className="section-title">Recent Activity</div>
          {recent.length === 0 ? (
            <div className="empty-state">No transactions yet. Add one to get started.</div>
          ) : (
            <ul className="recent-list">
              {recent.map((tx) => (
                <li key={tx.id} className="recent-item">
                  <span className="tx-icon">{CATEGORY_ICONS[tx.category] || "💳"}</span>
                  <div className="tx-info">
                    <span className="tx-desc">{tx.description || tx.category}</span>
                    <span className="tx-date">{new Date(tx.date).toLocaleDateString("en", { month: "short", day: "numeric" })}</span>
                  </div>
                  <span className={`tx-amount ${tx.type}`}>
                    {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
