import React, { useState, useEffect, useCallback } from "react";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import AddTransaction from "./components/AddTransaction";
import TransactionList from "./components/TransactionList";
import BudgetManager from "./components/BudgetManager";
import "./App.css";

const API = process.env.REACT_APP_API_URL || "";

export default function App() {
  // ─── Auth State ─────────────────────────────────────────────────────────────
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [username, setUsername] = useState(() => localStorage.getItem("username") || null);

  // ─── App State ───────────────────────────────────────────────────────────────
  const [summary, setSummary] = useState({ total_income: 0, total_expense: 0, balance: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // ─── Auth Header helper ──────────────────────────────────────────────────────
  const authHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  // ─── Fetch Data ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [sumRes, txRes] = await Promise.all([
        fetch(`${API}/api/summary`, { headers: authHeaders() }),
        fetch(`${API}/api/transactions?limit=100`, { headers: authHeaders() }),
      ]);

      if (sumRes.status === 401) { handleLogout(); return; }

      const sumData = await sumRes.json();
      const txData = await txRes.json();
      setSummary(sumData.summary);
      setTransactions(txData);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, authHeaders]);

  useEffect(() => {
    if (token) { fetchData(); } else { setLoading(false); }
  }, [token, fetchData]);

  // ─── Login / Logout ──────────────────────────────────────────────────────────
  const handleLogin = (newToken, newUsername) => {
    setToken(newToken);
    setUsername(newUsername);
    setLoading(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    setUsername(null);
    setSummary({ total_income: 0, total_expense: 0, balance: 0 });
    setTransactions([]);
    setLoading(true);
  };

  // ─── CRUD ────────────────────────────────────────────────────────────────────
  const handleAdd = async (tx) => {
    await fetch(`${API}/api/transactions`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(tx),
    });
    fetchData();
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/api/transactions/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    fetchData();
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (!token) return <AuthPage onLogin={handleLogin} />;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-pulse" />
        <span>Loading your finances...</span>
      </div>
    );
  }

  const NAV_TABS = [
    { id: "dashboard",    label: "Overview" },
    { id: "transactions", label: "History"  },
    { id: "budgets",      label: "Budgets"  },
    { id: "add",          label: "+ Add"    },
  ];

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">◈</span>
            <span className="logo-text">FlowTrack</span>
          </div>

          <nav className="nav">
            {NAV_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`nav-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="header-user">
            <span className="user-badge">@{username}</span>
            <button className="logout-btn" onClick={handleLogout} title="Logout">⏻</button>
          </div>
        </div>
      </header>

      <main className="main">
        {activeTab === "dashboard"    && <Dashboard summary={summary} transactions={transactions} />}
        {activeTab === "transactions" && <TransactionList transactions={transactions} onDelete={handleDelete} />}
        {activeTab === "budgets"      && <BudgetManager token={token} />}
        {activeTab === "add"          && <AddTransaction onAdd={handleAdd} onSuccess={() => setActiveTab("dashboard")} />}
      </main>
    </div>
  );
}
