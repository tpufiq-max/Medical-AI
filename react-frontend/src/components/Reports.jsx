import { useContext, useState, useEffect } from "react";
import { AppContext } from "../context";
import { t } from "../translations";
import { MedicalRecordService } from "../services/dataService";
import "./Reports.css";

export default function Reports({ selectedContext }) {
  const { lang } = useContext(AppContext);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);

  const matchedRecords = selectedContext?.query
    ? records.filter((record) => {
        const query = selectedContext.query.toLowerCase();
        return [record.title, record.content, record.type, ...(record.tags || [])]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(query));
      })
    : [];
  const hasMatchedRecords = selectedContext && matchedRecords.length > 0;

  // Filter records based on selected type
  const filteredRecords = filterType === "all" 
    ? records 
    : records.filter(r => r.type === filterType);

  const displayedRecords = hasMatchedRecords ? matchedRecords : filteredRecords;

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const allRecords = await MedicalRecordService.getAll();

        if (isMounted) {
          setRecords(allRecords);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching records:", error);
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

  // Get unique record types for filter
  const recordTypes = ["all", ...new Set(records.map(r => r.type))];

  const selectedSummary = selectedContext ? (
    <div className="reports-selected-summary">
      <div className="reports-selected-title">Selected from chat</div>
      <div className="reports-selected-detail"><strong>{selectedContext.title}</strong></div>
      {selectedContext.subtitle && (
        <div className="reports-selected-detail">{selectedContext.subtitle}</div>
      )}
      {selectedContext.query && (
        <div className="reports-selected-query">Query: {selectedContext.query}</div>
      )}
    </div>
  ) : null;

  return (
    <div className="reports-container">
      <div className="reports-bg">
        <div className="reports-blob reports-blob-a"></div>
        <div className="reports-blob reports-blob-b"></div>
      </div>

      <div className="reports-header">
        <h1 className="reports-title">{t[lang].reports}</h1>
      </div>

      {loading ? (
        <div className="reports-empty">
          <p className="reports-empty-text">Loading reports...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="reports-empty">
          <p className="reports-empty-text">Your medical reports will appear here.</p>
        </div>
      ) : (
        <div>
          <div className="reports-filter-bar">
            <label className="reports-filter-label">Filter by Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="reports-filter-select"
            >
              {recordTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All Types" : type}
                </option>
              ))}
            </select>
          </div>

          <div className="reports-panel-layout">
            <div className="reports-panel-left">
              <div className="reports-panel-title">
                Medical Records
                  <div className="reports-panel-count">{displayedRecords.length}</div>
              </div>
              {selectedSummary}
              {selectedContext && hasMatchedRecords && (
                <div className="reports-filter-note">Showing records that match the selected chat query.</div>
              )}
              {filteredRecords.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No records of this type.</p>
              ) : (
                <div className="reports-list">
                      {displayedRecords.map((record) => (
                    <div
                      key={record.id}
                      className={`reports-item ${selectedRecord?.id === record.id ? "active" : ""}`}
                      onClick={() => setSelectedRecord(record)}
                    >
                      <div className="reports-item-title">{record.title}</div>
                      <div className="reports-item-meta">
                        <span className="reports-item-type">{record.type}</span>
                        <span className="reports-item-date">
                          {new Date(record.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="reports-panel-right">
              <div className="reports-panel-title">Details</div>
              {selectedRecord ? (
                <div className="reports-details">
                  <div className="reports-detail-field">
                    <label className="reports-detail-label">Title</label>
                    <div className="reports-detail-value">{selectedRecord.title}</div>
                  </div>
                  <div className="reports-detail-field">
                    <label className="reports-detail-label">Type</label>
                    <div className="reports-detail-value" style={{ textTransform: "capitalize" }}>
                      {selectedRecord.type}
                    </div>
                  </div>
                  <div className="reports-detail-field">
                    <label className="reports-detail-label">Date</label>
                    <div className="reports-detail-value">
                      {new Date(selectedRecord.date).toLocaleString()}
                    </div>
                  </div>
                  {selectedRecord.content && (
                    <div className="reports-detail-field">
                      <label className="reports-detail-label">Content</label>
                      <div className="reports-detail-content">{selectedRecord.content}</div>
                    </div>
                  )}
                  {selectedRecord.tags && selectedRecord.tags.length > 0 && (
                    <div className="reports-detail-field">
                      <label className="reports-detail-label">Tags</label>
                      <div className="reports-tags">
                        {selectedRecord.tags.map((tag, idx) => (
                          <span key={idx} className="reports-tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="reports-details">
                  <div className="reports-details-placeholder">
                    Select a record to view details
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
