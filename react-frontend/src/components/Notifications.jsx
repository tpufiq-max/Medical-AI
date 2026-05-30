import { useContext, useState, useRef, useEffect } from "react";
import { AppContext } from "../context";
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle } from "lucide-react";
import "./Notifications.css";

export default function Notifications() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useContext(AppContext);
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const getIcon = (type) => {
    switch (type) {
      case "success": return <CheckCircle size={14} className="nt-icon-success" />;
      case "warning": return <AlertTriangle size={14} className="nt-icon-warning" />;
      default: return <Info size={14} className="nt-icon-info" />;
    }
  };

  const timeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="nt-container" ref={panelRef}>
      <button className="nt-bell" onClick={() => setOpen(!open)}>
        <Bell size={18} />
        {unreadCount > 0 && <span className="nt-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="nt-panel">
          <div className="nt-panel-head">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="nt-mark-all" onClick={markAllNotificationsRead}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="nt-panel-body">
            {notifications.length === 0 ? (
              <div className="nt-empty">
                <Bell size={24} />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  className={`nt-item ${!n.read ? "nt-item-unread" : ""}`}
                  onClick={() => { if (!n.read) markNotificationRead(n.id); }}
                >
                  <div className="nt-item-icon">{getIcon(n.type)}</div>
                  <div className="nt-item-content">
                    <p className="nt-item-title">{n.title}</p>
                    <p className="nt-item-message">{n.message}</p>
                    <span className="nt-item-time">{timeAgo(n.timestamp)}</span>
                  </div>
                  {!n.read && <div className="nt-unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
