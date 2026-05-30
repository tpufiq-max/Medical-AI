import { useContext, useState } from "react";
import { AppContext } from "./context";

import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Search from "./components/Search";
import Chatbot from "./components/Chatbot";
import Interaction from "./components/Interaction";
import Settings from "./components/Settings";
import Consultations from "./components/Consultations";
import History from "./components/History";
import Reports from "./components/Reports";
import Analytics from "./components/Analytics";
import Notifications from "./components/Notifications";

import "./App.css";

function App() {
  const { theme, page, setPage } = useContext(AppContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setSidebarOpen(false);
  };

  return (
    <div className={`app-root ${theme}`}>
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className={`sidebar-wrapper ${sidebarOpen ? "sidebar-mobile-open" : ""}`}>
        {sidebarOpen && (
          <button className="sidebar-close-btn" aria-label="Close menu" onClick={() => setSidebarOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <Sidebar setPage={handlePageChange} active={page} />
      </div>

      <div className="main">
        {/* Top bar with hamburger + notifications */}
        <div className="app-topbar">
          <button className="mobile-menu-btn" aria-label="Open menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="topbar-right">
            <Notifications />
          </div>
        </div>

        {page === "dashboard"     && <Dashboard />}
        {page === "search"        && <Search />}
        {page === "chatbot"       && <Chatbot />}
        {page === "interaction"   && <Interaction />}
        {page === "settings"      && <Settings />}
        {page === "consultations" && <Consultations />}
        {page === "history"       && <History />}
        {page === "reports"       && <Reports />}
        {page === "analytics"     && <Analytics />}
      </div>
    </div>
  );
}

export default App;
