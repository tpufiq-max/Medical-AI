import { createContext, useState } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  // Read saved theme from localStorage, default to "dark"
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "dark"
  );

  // Read saved language from localStorage, default to "en"
  const [lang, setLangState] = useState(
    () => localStorage.getItem("lang") || "en"
  );

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);  // persists on reload
  };

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem("lang", code);   // persists on reload
  };

  return (
    <AppContext.Provider value={{ theme, toggleTheme, lang, setLang }}>
      {children}
    </AppContext.Provider>
  );
}