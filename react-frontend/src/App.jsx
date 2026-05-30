import { useContext, useState } from "react";
import { AppContext } from "./context";

import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Search from "./components/Search";
import Chatbot from "./components/Chatbot";
import Interaction from "./components/Interaction";
import Settings from "./components/Settings";

import "./App.css";

function App() {
  const { theme } = useContext(AppContext);         // ← read theme from context
  const [page, setPage] = useState("dashboard");
  const [navOpen, setNavOpen] = useState(false);    // ← mobile sidebar drawer

  // Navigate + auto-close drawer on small screens (routing logic unchanged)
  const goTo = (next) => {
    setPage(next);
    setNavOpen(false);
  };

  return (
    // ← add `theme` class here so ALL children get CSS variables
    <div className={`app-root ${theme}`}>
      {/* Mobile top bar */}
      <header className="app-topbar">
        <button
          className="app-menu-btn"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={navOpen}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="app-topbar-brand">
          <span className="app-topbar-mark">✛</span>
          MedAI
        </span>
      </header>

      <Sidebar setPage={goTo} active={page} open={navOpen} onClose={() => setNavOpen(false)} />

      {navOpen && <div className="sidebar-scrim" onClick={() => setNavOpen(false)} />}

      <div className="main">
        <div className="page-fade" key={page}>
          {page === "dashboard"   && <Dashboard />}
          {page === "search"      && <Search />}
          {page === "chatbot"     && <Chatbot />}
          {page === "interaction" && <Interaction />}
          {page === "settings"    && <Settings />}
        </div>
      </div>
    </div>
  );
}

export default App;
