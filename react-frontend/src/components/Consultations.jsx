import { useContext, useState, useEffect } from "react";
import { AppContext } from "../context";
import { Search, Filter, Clock, MessageSquare, Pill, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import "./Consultations.css";

export default function Consultations() {
  const { ConsultationService } = useContext(AppContext);
  const [consultations, setConsultations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const all = ConsultationService.getAll();
      setConsultations(all);
      setFiltered(all);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [ConsultationService]);

  useEffect(() => {
    let result = consultations;
    if (typeFilter !== "all") {
      result = result.filter(c => c.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        (c.query && c.query.toLowerCase().includes(q)) ||
        (c.diagnosis && c.diagnosis.toLowerCase().includes(q))
      );
    }
    setFiltered(result);
  }, [searchQuery, typeFilter, consultations]);

  const getTypeIcon = (type) => {
    switch (type) {
      case "chat": return <MessageSquare size={14} />;
      case "search": return <Pill size={14} />;
      case "interaction": return <AlertTriangle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="cs-page">
        <div className="cs-header">
          <h1 className="cs-title">Consultations</h1>
          <p className="cs-subtitle">Your consultation history</p>
        </div>
        <div className="cs-skeleton-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="cs-skeleton-card">
              <div className="cs-skeleton-line cs-skeleton-short" />
              <div className="cs-skeleton-line cs-skeleton-long" />
              <div className="cs-skeleton-line cs-skeleton-medium" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="cs-page">
      <div className="cs-header">
        <div>
          <h1 className="cs-title">Consultations</h1>
          <p className="cs-subtitle">View and search your consultation history</p>
        </div>
        <span className="cs-count">{filtered.length} records</span>
      </div>

      {/* Search and Filter */}
      <div className="cs-toolbar">
        <div className="cs-search-wrap">
          <Search size={16} className="cs-search-icon" />
          <input
            type="text"
            className="cs-search-input"
            placeholder="Search consultations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="cs-filter-wrap">
          <Filter size={14} />
          <select
            className="cs-filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="chat">Chat</option>
            <option value="search">Search</option>
            <option value="interaction">Interaction</option>
          </select>
        </div>
      </div>

      {/* Consultations List */}
      {filtered.length === 0 ? (
        <div className="cs-empty">
          <div className="cs-empty-icon">💬</div>
          <h3>No consultations found</h3>
          <p>Start a chat, search for medicine, or check drug interactions to see your history here.</p>
        </div>
      ) : (
        <div className="cs-timeline">
          {filtered.map((c) => (
            <div key={c.id} className={`cs-card ${expandedId === c.id ? "cs-card-expanded" : ""}`}>
              <div className="cs-card-main" onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}>
                <div className="cs-card-left">
                  <div className="cs-timeline-dot" />
                  <div className="cs-card-content">
                    <div className="cs-card-top">
                      <span className={`cs-type-badge cs-type-${c.type}`}>
                        {getTypeIcon(c.type)} {c.type}
                      </span>
                      <span className="cs-card-date">{formatDate(c.date)} at {formatTime(c.date)}</span>
                    </div>
                    <p className="cs-card-query">{c.query || "No query recorded"}</p>
                    {c.diagnosis && <p className="cs-card-diag">{c.diagnosis}</p>}
                  </div>
                </div>
                <button className="cs-expand-btn">
                  {expandedId === c.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {expandedId === c.id && (
                <div className="cs-card-detail">
                  {c.response && (
                    <div className="cs-detail-section">
                      <h4>Response</h4>
                      <p>{typeof c.response === "string" ? c.response : JSON.stringify(c.response, null, 2)}</p>
                    </div>
                  )}
                  {c.symptoms && c.symptoms.length > 0 && (
                    <div className="cs-detail-section">
                      <h4>Symptoms</h4>
                      <div className="cs-tags">
                        {c.symptoms.map((s, i) => <span key={i} className="cs-tag">{s}</span>)}
                      </div>
                    </div>
                  )}
                  {c.recommendations && c.recommendations.length > 0 && (
                    <div className="cs-detail-section">
                      <h4>Recommendations</h4>
                      <ul className="cs-rec-list">
                        {c.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
