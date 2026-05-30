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

import "./App.css";

function App() {
  const { theme } = useContext(AppContext);         // ← read theme from context
  const [page, setPage] = useState("dashboard");

  return (
    // ← add `theme` class here so ALL children get CSS variables
    <div className={`app-root ${theme}`}>
      <Sidebar setPage={setPage} active={page} />

      <div className="main">
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
