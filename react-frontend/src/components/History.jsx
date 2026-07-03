import { useState, useEffect } from "react";
import { ActivityLogService } from "../services/dataService";
import "./History.css";

function History({ selectedContext }) {
  const [timeline, setTimeline] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const timelineData = await ActivityLogService.getTimeline();
        const recentData = await ActivityLogService.getRecent(50);

        if (isMounted) {
          setTimeline(timelineData);
          setRecentLogs(recentData);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching activity:", error);
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchData, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredTimeline = selectedContext
    ? timeline
        .map((day) => ({
          ...day,
          items: day.items.filter((log) => {
            const text = `${log.action} ${log.details || ""} ${log.category || ""}`.toLowerCase();
            return selectedContext.query
              ? text.includes(selectedContext.query.toLowerCase())
              : false;
          }),
        }))
        .filter((day) => day.items.length > 0)
    : timeline;

  const timelineToShow = selectedContext && filteredTimeline.length > 0 ? filteredTimeline : timeline;
  const hasMatchedActivity = selectedContext && filteredTimeline.length > 0;

  return (
    <div className="history-container">
      <div className="history-bg">
        <div className="history-blob history-blob-a"></div>
        <div className="history-blob history-blob-b"></div>
      </div>

      <div className="history-header">
        <h1 className="history-title">History</h1>
      </div>

      {selectedContext && (
        <div className="history-selected-summary">
          <div className="history-selected-title">Selected from chat</div>
          <div className="history-selected-detail"><strong>{selectedContext.title}</strong></div>
          {selectedContext.subtitle && (
            <div className="history-selected-detail">{selectedContext.subtitle}</div>
          )}
          {selectedContext.query && (
            <div className="history-selected-query">Query: {selectedContext.query}</div>
          )}
          {hasMatchedActivity && (
            <div className="history-selected-match">Showing matching activity items below.</div>
          )}
          {selectedContext && !hasMatchedActivity && (
            <div className="history-selected-match history-selected-no-match">
              No exact activity match found. Showing full history.
            </div>
          )}
        </div>
      )}

      {timeline.length === 0 ? (
        <div className="history-empty">
          <div className="history-empty-icon">📋</div>
          <p className="history-empty-text">No history yet. Your activity will appear here.</p>
        </div>
      ) : (
        <div className="history-timeline">
          {timelineToShow.slice(0, 7).map((day) => (
            <div key={day.date} className="history-day-section">
              <div className="history-day-header">
                <span className="history-day-date">
                  {new Date(day.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <div className="history-day-badge">{day.items.length}</div>
              </div>
              <div className="history-activity-list">
                {day.items.slice(0, 10).map((log) => (
                  <div key={log.id} className="history-activity-item">
                    <div className="history-activity-icon">
                      {log.action === "chat" && "💬"}
                      {log.action === "upload" && "📤"}
                      {log.action === "analysis" && "📊"}
                      {log.action === "save" && "💾"}
                      {log.action === "search" && "🔍"}
                      {!["chat", "upload", "analysis", "save", "search"].includes(log.action) && "✓"}
                    </div>
                    <div className="history-activity-content">
                      <div className="history-activity-action">{log.action}</div>
                      {log.details && (
                        <div className="history-activity-details">{log.details}</div>
                      )}
                      {log.category && (
                        <div className="history-activity-category">{log.category}</div>
                      )}
                    </div>
                    <div className="history-activity-time">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default History;