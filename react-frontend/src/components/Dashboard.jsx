import { useEffect, useState, useContext } from "react";
import { AppContext } from "../context";
import {
  Pill, AlertTriangle, MessageSquare, Camera, RefreshCw,
  Activity, TrendingUp, FileText, Users, ArrowRight
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import "./Dashboard.css";

const API = "http://localhost:5001";

const STAT_CONFIG = [
  { key: "searches", label: "Searches", icon: Pill, cls: "stat-blue", color: "#4f8cff" },
  { key: "interactions", label: "Interactions", icon: AlertTriangle, cls: "stat-amber", color: "#f59e0b" },
  { key: "chats", label: "Chats", icon: MessageSquare, cls: "stat-emerald", color: "#10b981" },
  { key: "scans", label: "Scans", icon: Camera, cls: "stat-rose", color: "#f43f5e" },
];

const PIE_COLORS = ["#4f8cff", "#f59e0b", "#10b981", "#f43f5e", "#8b5cf6"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.stroke || p.fill }}>
          <span className="tooltip-key">{p.dataKey || p.name}</span>
          <span className="tooltip-val">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

function StatCard({ cfg, value, index }) {
  const Icon = cfg.icon;
  const [prev, setPrev] = useState(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (value !== prev) {
      setFlash(true);
      setPrev(value);
      setTimeout(() => setFlash(false), 600);
    }
  }, [value]);

  return (
    <div className={`stat-card ${cfg.cls} ${flash ? "flash" : ""}`} style={{ "--delay": `${index * 0.08}s` }}>
      <div className="stat-icon-wrap">
        <Icon size={18} strokeWidth={1.75} />
      </div>
      <div className="stat-body">
        <span className="stat-label">{cfg.label}</span>
        <span className="stat-value">{value ?? 0}</span>
      </div>
      <div className="stat-glow" />
    </div>
  );
}

function TimelineItem({ item, index }) {
  const text = typeof item === "string" ? item : (item.action || item.details || "Activity");
  const time = item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  return (
    <div className="timeline-row" style={{ "--ti": index }}>
      <div className="tl-line" />
      <div className="tl-dot" />
      <p className="tl-text">
        {text}
        {time && <span className="tl-time">{time}</span>}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { ConsultationService, ActivityLogService, AnalyticsService, setPage } = useContext(AppContext);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  // localStorage-based analytics
  const [localStats, setLocalStats] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [activityTimeline, setActivityTimeline] = useState([]);

  useEffect(() => {
    const fetchStats = () => {
      setUpdating(true);
      fetch(`${API}/stats`)
        .then((r) => r.json())
        .then((data) => {
          setStats(data.stats || {});
          setRecent(data.recent || []);
          setHistory(data.history || []);
          setError("");
        })
        .catch(() => setError("Failed to load live data - showing local analytics"))
        .finally(() => setUpdating(false));
    };
    fetchStats();
    const id = setInterval(fetchStats, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Load localStorage analytics
    const total = AnalyticsService.totalConsultations();
    const thisMonth = AnalyticsService.recentCount(30);
    const breakdown = AnalyticsService.categoryBreakdown();
    const activity = AnalyticsService.activitySummary();

    setLocalStats({
      totalConsultations: total,
      thisMonth: thisMonth,
      aiInteractions: activity.total,
      activeRecords: breakdown.reduce((s, b) => s + b.value, 0),
    });

    // Monthly chart data - last 6 months
    const monthly = AnalyticsService.monthlyStats();
    const last6 = monthly.slice(-6);
    if (last6.length === 0) {
      // Generate placeholder data
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push({ month: d.toLocaleString("default", { month: "short" }), count: 0 });
      }
      setMonthlyData(months);
    } else {
      setMonthlyData(last6.map(m => ({
        month: new Date(m.month + "-01").toLocaleString("default", { month: "short" }),
        count: m.count,
      })));
    }

    // Pie chart data
    if (breakdown.length > 0) {
      setPieData(breakdown);
    } else {
      setPieData([
        { name: "chat", value: 0 },
        { name: "search", value: 0 },
        { name: "interaction", value: 0 },
      ]);
    }

    // Recent consultations
    setRecentConsultations(ConsultationService.getRecent(5));

    // Activity timeline
    setActivityTimeline(ActivityLogService.getRecent(10));
  }, [AnalyticsService, ConsultationService, ActivityLogService]);

  if (!stats && !error) {
    return (
      <div className="dashboard loading-state">
        <div className="loader-ring" />
        <p>Initialising dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="db-bg">
        <div className="db-blob db-blob-a" />
        <div className="db-blob db-blob-b" />
      </div>

      {/* HEADER */}
      <header className="db-header">
        <div className="db-header-left">
          <span className="db-badge">LIVE MONITORING</span>
          <h1 className="db-title">Medical Dashboard</h1>
          <p className="db-sub">Real-time medicine analysis &amp; interaction data</p>
        </div>
        <div className={`db-sync ${updating ? "spinning" : ""}`}>
          <RefreshCw size={14} />
          <span>{updating ? "Syncing..." : "Auto-sync on"}</span>
        </div>
      </header>

      {error && <div className="db-error">{error}</div>}

      {/* API STAT CARDS */}
      {stats && (
        <section className="stats-grid">
          {STAT_CONFIG.map((cfg, i) => (
            <StatCard key={cfg.key} cfg={cfg} value={stats[cfg.key]} index={i} />
          ))}
        </section>
      )}

      {/* LOCAL ANALYTICS STATS */}
      <section className="stats-grid db-local-stats">
        <div className="stat-card stat-blue" style={{ "--delay": "0s" }}>
          <div className="stat-icon-wrap"><Activity size={18} strokeWidth={1.75} /></div>
          <div className="stat-body">
            <span className="stat-label">Total Consultations</span>
            <span className="stat-value">{localStats.totalConsultations || 0}</span>
          </div>
          <div className="stat-glow" />
        </div>
        <div className="stat-card stat-emerald" style={{ "--delay": "0.08s" }}>
          <div className="stat-icon-wrap"><TrendingUp size={18} strokeWidth={1.75} /></div>
          <div className="stat-body">
            <span className="stat-label">This Month</span>
            <span className="stat-value">{localStats.thisMonth || 0}</span>
          </div>
          <div className="stat-glow" />
        </div>
        <div className="stat-card stat-amber" style={{ "--delay": "0.16s" }}>
          <div className="stat-icon-wrap"><MessageSquare size={18} strokeWidth={1.75} /></div>
          <div className="stat-body">
            <span className="stat-label">AI Interactions</span>
            <span className="stat-value">{localStats.aiInteractions || 0}</span>
          </div>
          <div className="stat-glow" />
        </div>
        <div className="stat-card stat-rose" style={{ "--delay": "0.24s" }}>
          <div className="stat-icon-wrap"><FileText size={18} strokeWidth={1.75} /></div>
          <div className="stat-body">
            <span className="stat-label">Active Records</span>
            <span className="stat-value">{localStats.activeRecords || 0}</span>
          </div>
          <div className="stat-glow" />
        </div>
      </section>

      {/* CHARTS ROW */}
      <div className="db-charts-row">
        {/* Area Chart - Monthly Trends */}
        <div className="chart-card db-area-chart">
          <div className="card-head">
            <h3 className="card-title">Monthly Consultation Trends</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f8cff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4f8cff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#5c6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#5c6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#4f8cff" strokeWidth={2} fill="url(#areaGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Type Breakdown */}
        <div className="chart-card db-pie-chart">
          <div className="card-head">
            <h3 className="card-title">Consultation Types</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                nameKey="name"
                paddingAngle={2}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="db-pie-legend">
            {pieData.map((item, i) => (
              <span key={item.name} className="legend-item">
                <span className="legend-dot" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {item.name} ({item.value})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Chart + Activity */}
      <div className="db-bottom">
        {/* Existing API chart */}
        {history.length > 0 && (
          <div className="chart-card">
            <div className="card-head">
              <h3 className="card-title">Usage Trend</h3>
              <div className="chart-legend">
                {STAT_CONFIG.map((c) => (
                  <span key={c.key} className="legend-item">
                    <span className="legend-dot" style={{ background: c.color }} />
                    {c.label}
                  </span>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={history} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="type" tick={{ fill: "#5c6080", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#5c6080", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                {STAT_CONFIG.map((c) => (
                  <Line key={c.key} type="monotone" dataKey={c.key} stroke={c.color} strokeWidth={2} dot={{ r: 3, fill: c.color, strokeWidth: 0 }} activeDot={{ r: 5, fill: c.color, strokeWidth: 0 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Activity */}
        <div className="activity-card">
          <div className="card-head">
            <h3 className="card-title">Recent Activity</h3>
            <span className="activity-count">{(activityTimeline.length || recent.length)} events</span>
          </div>
          {activityTimeline.length > 0 ? (
            <div className="timeline">
              {activityTimeline.map((item, i) => (
                <TimelineItem key={item.id || i} item={item} index={i} />
              ))}
            </div>
          ) : recent.length > 0 ? (
            <div className="timeline">
              {recent.map((item, i) => (
                <TimelineItem key={i} item={item} index={i} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>No activity yet - start using the app</p>
            </div>
          )}
        </div>
      </div>

      {/* RECENT CONSULTATIONS */}
      <div className="db-recent-section">
        <div className="card-head">
          <h3 className="card-title">Recent Consultations</h3>
        </div>
        {recentConsultations.length > 0 ? (
          <div className="db-recent-grid">
            {recentConsultations.map((c) => (
              <div key={c.id} className="db-recent-card">
                <div className="db-recent-card-head">
                  <span className={`db-type-badge db-type-${c.type}`}>{c.type}</span>
                  <span className="db-recent-date">{new Date(c.date).toLocaleDateString()}</span>
                </div>
                <p className="db-recent-query">{c.query || "No query"}</p>
                {c.diagnosis && <p className="db-recent-diag">{c.diagnosis}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">💬</span>
            <p>No consultations yet - try the chatbot or search</p>
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div className="db-quick-actions">
        <h3 className="card-title">Quick Actions</h3>
        <div className="db-actions-grid">
          <button className="db-action-btn" onClick={() => setPage('chatbot')}>
            <MessageSquare size={18} /> AI Chat <ArrowRight size={14} />
          </button>
          <button className="db-action-btn" onClick={() => setPage('search')}>
            <Pill size={18} /> Medicine Search <ArrowRight size={14} />
          </button>
          <button className="db-action-btn" onClick={() => setPage('interaction')}>
            <AlertTriangle size={18} /> Drug Interaction <ArrowRight size={14} />
          </button>
          <button className="db-action-btn" onClick={() => setPage('reports')}>
            <FileText size={18} /> View Reports <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
