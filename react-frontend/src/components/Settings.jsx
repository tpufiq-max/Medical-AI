import { useContext, useState } from "react";
import { AppContext } from "../context";
import "./Settings.css";

function Settings() {
  const { toggleTheme, theme, setLang, lang } = useContext(AppContext);
  const [ripple, setRipple] = useState(null);

  const handleLangClick = (code, e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top, code });
    setTimeout(() => setRipple(null), 500);
    setLang(code);
  };

  const langs = [
    { code: "en", label: "English", sub: "EN" },
    { code: "hi", label: "हिंदी", sub: "HI" },
    { code: "kn", label: "ಕನ್ನಡ", sub: "KN" },
  ];

  return (
    <div className={`settings-page ${theme}`}>
      <div className="settings-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="grain" />
      </div>

      <div className="settings-inner">
        <header className="settings-header">
          <div className="header-badge">PREFERENCES</div>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-sub">Customize your experience</p>
        </header>

        {/* THEME CARD */}
        <div className="settings-card" style={{ "--delay": "0.1s" }}>
          <div className="card-label">
            <span className="card-icon">
              {theme === "dark" ? "🌙" : "☀️"}
            </span>
            <div>
              <p className="card-title">Appearance</p>
              <p className="card-hint">
                {theme === "dark" ? "Dark mode is on" : "Light mode is on"}
              </p>
            </div>
          </div>

          <button
            className={`toggle-track ${theme === "dark" ? "on" : ""}`}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            <div className="toggle-thumb">
              <span className="thumb-icon">
                {theme === "dark" ? "🌙" : "☀️"}
              </span>
            </div>
          </button>
        </div>

        {/* LANGUAGE CARD */}
        <div className="settings-card" style={{ "--delay": "0.2s" }}>
          <div className="card-label">
            <span className="card-icon">🌐</span>
            <div>
              <p className="card-title">Language</p>
              <p className="card-hint">Select your preferred language</p>
            </div>
          </div>

          <div className="lang-grid">
            {langs.map(({ code, label, sub }) => (
              <button
                key={code}
                className={`lang-btn ${lang === code ? "active" : ""}`}
                onClick={(e) => handleLangClick(code, e)}
              >
                {ripple?.code === code && (
                  <span
                    className="ripple"
                    style={{ left: ripple.x, top: ripple.y }}
                  />
                )}
                <span className="lang-sub">{sub}</span>
                <span className="lang-label">{label}</span>
                {lang === code && <span className="lang-check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* DECORATIVE FOOTER */}
        <div className="settings-footer">
          <span>v2.0.0</span>
          <span className="dot" />
          <span>All changes are saved automatically</span>
        </div>
      </div>
    </div>
  );
}

export default Settings;