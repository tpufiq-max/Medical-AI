import { useContext } from "react";
import { AppContext } from "../context";
import { t } from "../translations";
import "./Sidebar.css";

const icons = {
  dashboard:     { svg: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
  consultations: { svg: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 012-2h2a2 2 0 012 2 M9 5h6 M9 14h6 M9 18h6 M9 10h6" },
  search:        { svg: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" },
  chatbot:       { svg: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
  interaction:   { svg: "M22 12h-4l-3 9L9 3l-3 9H2" },
  history:       { svg: "M12 8v4l3 3 M3.05 11a9 9 0 1118 2 M3.05 11l-2 2 M3.05 11l2 2" },
  reports:       { svg: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" },
  analytics:     { svg: "M18 20V10 M12 20V4 M6 20v-6" },
  settings:      { svg: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
};

const sections = [
  {
    label: "MAIN",
    items: ["dashboard", "consultations"],
  },
  {
    label: "TOOLS",
    items: ["search", "chatbot", "interaction"],
  },
  {
    label: "RECORDS",
    items: ["history", "reports", "analytics"],
  },
  {
    label: "SYSTEM",
    items: ["settings"],
  },
];

function NavIcon({ paths }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths.split(" M").map((p, i) => (
        <path key={i} d={(i === 0 ? "" : "M") + p} />
      ))}
    </svg>
  );
}

function Sidebar({ setPage, active, open = false, onClose }) {
  const { lang } = useContext(AppContext);

  const handleKey = (e, item) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setPage(item);
    }
  };

  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`} aria-label="Primary navigation">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-mark">
          <span className="brand-cross">✛</span>
        </div>
        <div className="brand-text">
          <span className="brand-name">MedAI</span>
          <span className="brand-tagline">Health Intelligence</span>
        </div>

        {/* Mobile close button */}
        <button className="sidebar-close" onClick={onClose} aria-label="Close navigation menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Nav sections */}
      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="nav-section-label">{section.label}</p>
            <ul>
              {section.items.map((item, i) => (
                <li
                  key={item}
                  className={`nav-item ${active === item ? "active" : ""}`}
                  onClick={() => setPage(item)}
                  onKeyDown={(e) => handleKey(e, item)}
                  style={{ "--i": i }}
                  role="button"
                  tabIndex={0}
                  aria-current={active === item ? "page" : undefined}
                >
                  <span className="nav-icon">
                    <NavIcon paths={icons[item].svg} />
                  </span>
                  <span className="nav-label">{t[lang][item] || item}</span>
                  {active === item && <span className="nav-pip" />}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="status-dot" />
        <span>System Online</span>
      </div>
    </aside>
  );
}

export default Sidebar;
