import React, { useMemo } from "react";
import "./Dashboard.css";

const fmt = (n) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(n || 0);

const CATEGORY_ICONS = {
  salary: "💼", freelance: "💻", investment: "📈", gift: "🎁", other: "💰",
  food: "🍔", rent: "🏠", transport: "🚗", shopping: "🛍️", health: "💊",
  entertainment: "🎮", bills: "📄",
};

export default function Dashboard({ summary, transactions, budgets }) {
  const balance = parseFloat(summary?.balance || 0);
  const income = parseFloat(summary?.total_income || 0);
  const expense = parseFloat(summary?.total_expense || 0);
  const incomeWidth = income + expense > 0 ? (income / (income + expense)) * 100 : 50;

  // ─── Last 7 days bar chart ─────────────────────────────────────────────────
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

  // ─── Feature 1: Smart Spending Alerts ─────────────────────────────────────
  // Compare current month spending per category against set budgets
  const spendingAlerts = useMemo(() => {
    if (!budgets || budgets.length === 0) return [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    return budgets
      .map((b) => {
        const spent = transactions
          .filter((t) =>
            t.type === "expense" &&
            t.category === b.category &&
            t.date?.slice(0, 10) >= monthStart
          )
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const budget = parseFloat(b.budget || b.amount || 0);
        const pct = budget > 0 ? (spent / budget) * 100 : 0;
        return { category: b.category, spent, budget, pct };
      })
      .filter((a) => a.pct >= 75)
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, transactions]);

  // ─── Feature 2: Monthly Cash Flow Forecast ────────────────────────────────
  const forecast = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysLeft = daysInMonth - dayOfMonth;

    const monthStart = new Date(year, month, 1).toISOString().split("T")[0];
    const todayStr = now.toISOString().split("T")[0];

    const thisMonthTx = transactions.filter(
      (t) => t.date?.slice(0, 10) >= monthStart && t.date?.slice(0, 10) <= todayStr
    );

    const incomeThisMonth = thisMonthTx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    const expenseThisMonth = thisMonthTx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + parseFloat(t.amount), 0);

    // Daily burn rate this month
    const dailyBurn = dayOfMonth > 0 ? expenseThisMonth / dayOfMonth : 0;
    const projectedExpense = expenseThisMonth + dailyBurn * daysLeft;

    // Projected balance = current balance - remaining projected expenses
    // (income already counted in balance, only projecting extra expense)
    const projectedBalance = balance - dailyBurn * daysLeft;

    const savingsRate = incomeThisMonth > 0
      ? Math.round(((incomeThisMonth - expenseThisMonth) / incomeThisMonth) * 100)
      : 0;

    return {
      projectedBalance,
      projectedExpense,
      dailyBurn,
      daysLeft,
      daysInMonth,
      dayOfMonth,
      savingsRate,
      incomeThisMonth,
      expenseThisMonth,
    };
  }, [transactions, balance]);

  const forecastStatus =
    forecast.projectedBalance > 0 ? "positive" :
    forecast.projectedBalance > -500 ? "warning" : "negative";

  return (
    <div className="dashboard">

      {/* ─── Smart Spending Alerts ─────────────────────────────────────── */}
      {spendingAlerts.length > 0 && (
        <div className="alerts-row">
          {spendingAlerts.map((alert) => (
            <div
              key={alert.category}
              className={`alert-chip ${alert.pct >= 100 ? "alert-over" : "alert-warn"}`}
            >
              <span className="alert-icon">{alert.pct >= 100 ? "🔴" : "⚠️"}</span>
              <span className="alert-text">
                <strong>{alert.category.charAt(0).toUpperCase() + alert.category.slice(1)}</strong>
                {alert.pct >= 100
                  ? ` over budget by ${fmt(alert.spent - alert.budget)}`
                  : ` at ${Math.round(alert.pct)}% of budget (${fmt(alert.spent)} / ${fmt(alert.budget)})`
                }
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Summary Cards ─────────────────────────────────────────────── */}
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

      {/* ─── Forecast + Chart Row ───────────────────────────────────────── */}
      <div className="bottom-row">

        {/* Cash Flow Forecast Card */}
        <div className={`card forecast-card forecast-${forecastStatus}`}>
          <div className="section-title">📊 Month Forecast</div>

          <div className="forecast-main">
            <div className="forecast-projected">
              <div className="forecast-label">Projected End Balance</div>
              <div className={`forecast-amount ${forecastStatus}`}>{fmt(forecast.projectedBalance)}</div>
            </div>
            <div className="forecast-divider" />
            <div className="forecast-stats">
              <div className="fstat">
                <span className="fstat-label">Daily Burn</span>
                <span className="fstat-value expense-color">{fmt(forecast.dailyBurn)}/day</span>
              </div>
              <div className="fstat">
                <span className="fstat-label">Days Left</span>
                <span className="fstat-value">{forecast.daysLeft} days</span>
              </div>
              <div className="fstat">
                <span className="fstat-label">Savings Rate</span>
                <span className={`fstat-value ${forecast.savingsRate >= 0 ? "income-color" : "expense-color"}`}>
                  {forecast.savingsRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Month Progress Bar */}
          <div className="month-progress-wrap">
            <div className="month-progress-track">
              <div
                className="month-progress-fill"
                style={{ width: `${(forecast.dayOfMonth / forecast.daysInMonth) * 100}%` }}
              />
            </div>
            <div className="month-progress-label">
              Day {forecast.dayOfMonth} of {forecast.daysInMonth}
            </div>
          </div>

          {forecastStatus === "negative" && (
            <div className="forecast-warning">
              ⚡ At this rate, balance turns negative before month end
            </div>
          )}
        </div>

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
      </div>

      {/* ─── Recent Transactions ────────────────────────────────────────── */}
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
  );
}
