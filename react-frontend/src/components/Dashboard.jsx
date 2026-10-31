import { useEffect, useState } from "react";
import { Pill, AlertTriangle, MessageSquare, Camera, RefreshCw } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { API_URL } from "../services/api";
import "./Dashboard.css";

const STAT_CONFIG = [
  {
    key: "searches",
    label: "Searches",
    icon: Pill,
    cls: "stat-blue",
    color: "#4f8cff",
  },
  {
    key: "interactions",
    label: "Interactions",
    icon: AlertTriangle,
    cls: "stat-amber",
    color: "#f59e0b",
  },
  {
    key: "chats",
    label: "Chats",
    icon: MessageSquare,
    cls: "stat-emerald",
    color: "#10b981",
  },
  {
    key: "scans",
    label: "Scans",
    icon: Camera,
    cls: "stat-rose",
    color: "#f43f5e",
  },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.stroke }}>
          <span className="tooltip-key">{p.dataKey}</span>
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
    <div
      className={`stat-card ${cfg.cls} ${flash ? "flash" : ""}`}
      style={{ "--delay": `${index * 0.08}s` }}
    >
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
  return (
    <div className="timeline-row" style={{ "--ti": index }}>
      <div className="tl-line" />
      <div className="tl-dot" />
      <p className="tl-text">{item}</p>
    </div>
  );
}

const DEFAULT_STATS = {
  searches: 0,
  interactions: 0,
  chats: 0,
  scans: 0,
  streams: 0,
};

export default function Dashboard() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [recent, setRecent] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer;

    const fetchStats = async () => {
      if (!cancelled) {
        setUpdating(true);
      }

      try {
        const response = await fetch(`${API_URL}/stats`, { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (cancelled) return;

        setStats({ ...DEFAULT_STATS, ...(data.stats || {}) });
        setRecent(data.recent || []);
        setHistory(data.history || []);
        setError("");
      } catch (err) {
        if (cancelled) return;

        console.error("Dashboard API error:", err);
        setError(`Failed to load dashboard: ${err.message}`);
        setStats(DEFAULT_STATS);
        setRecent([]);
        setHistory([]);
      } finally {
        if (!cancelled) {
          setUpdating(false);
          timer = setTimeout(fetchStats, 5000);
        }
      }
    };

    fetchStats();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="dashboard">
      {/* Background layers */}
      <div className="db-bg">
        <div className="db-blob db-blob-a" />
        <div className="db-blob db-blob-b" />
      </div>

      {/* ── HEADER ── */}
      <header className="db-header">
        <div className="db-header-left">
          <span className="db-badge">LIVE MONITORING</span>
          <h1 className="db-title">Medical Dashboard</h1>
          <p className="db-sub">Real-time medicine analysis &amp; interaction data</p>
        </div>

        <div className={`db-sync ${updating ? "spinning" : ""}`}>
          <RefreshCw size={14} />
          <span>{updating ? "Syncing…" : "Auto-sync on"}</span>
        </div>
      </header>

      {error && <div className="db-error">{error}</div>}

      {/* ── STAT CARDS ── */}
      <section className="stats-grid">
        {STAT_CONFIG.map((cfg, i) => (
          <StatCard key={cfg.key} cfg={cfg} value={stats[cfg.key]} index={i} />
        ))}
      </section>

      {/* ── CHART + ACTIVITY ── */}
      <div className="db-bottom">
        {/* Chart */}
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
              <CartesianGrid stroke="rgba(130,140,170,0.18)" vertical={false} />
              <XAxis
                dataKey="type"
                tick={{ fill: "#5c6080", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#5c6080", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {STAT_CONFIG.map((c) => (
                <Line
                  key={c.key}
                  type="monotone"
                  dataKey={c.key}
                  stroke={c.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: c.color, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: c.color, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Activity */}
        <div className="activity-card">
          <div className="card-head">
            <h3 className="card-title">Recent Activity</h3>
            <span className="activity-count">{recent.length} events</span>
          </div>

          {recent.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>No activity yet — start using the app</p>
            </div>
          ) : (
            <div className="timeline">
              {recent.map((item, i) => (
                <TimelineItem key={i} item={item} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}