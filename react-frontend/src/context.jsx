import { createContext, useState, useCallback } from "react";
import { ConsultationService, MedicalRecordService, ActivityLogService, AnalyticsService } from "./services/dataService";
import { NotificationService } from "./services/notificationService";

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

  // Notifications state
  const [notifications, setNotifications] = useState(
    () => NotificationService.getAll()
  );

  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const raw = localStorage.getItem("medai_chat_history");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);  // persists on reload
  };

  const setLang = (code) => {
    setLangState(code);
    localStorage.setItem("lang", code);   // persists on reload
  };

  const addNotification = useCallback((notification) => {
    const entry = NotificationService.add(notification);
    setNotifications(NotificationService.getAll());
    return entry;
  }, []);

  const markNotificationRead = useCallback((id) => {
    NotificationService.markRead(id);
    setNotifications(NotificationService.getAll());
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    NotificationService.markAllRead();
    setNotifications(NotificationService.getAll());
  }, []);

  const clearNotifications = useCallback(() => {
    NotificationService.clear();
    setNotifications([]);
  }, []);

  // Persist chat history across page navigation and reloads
  const updateChatHistory = useCallback((next) => {
    setChatHistory(prev => {
      const nextValue = typeof next === "function" ? next(prev) : next;
      try {
        localStorage.setItem("medai_chat_history", JSON.stringify(nextValue));
      } catch {
        // Ignore storage errors
      }
      return nextValue;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      theme, toggleTheme,
      lang, setLang,
      notifications,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      chatHistory,
      setChatHistory: updateChatHistory,
      ConsultationService,
      MedicalRecordService,
      ActivityLogService,
      AnalyticsService,
      NotificationService,
    }}>
      {children}
    </AppContext.Provider>
  );
}
