import { useContext, useState, useEffect } from "react";
import { AppContext } from "../context";
import { TrendingUp, Activity, BarChart3, PieChart as PieIcon } from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import "./Analytics.css";

const COLORS = ["#4f8cff", "#10b981", "#f59e0b", "#f43f5e", "#8b5cf6"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      <p className="an-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="an-tooltip-row" style={{ color: p.stroke || p.fill }}>
          <span>{p.dataKey || p.name}</span>
          <span className="an-tooltip-val">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { AnalyticsService, ConsultationService } = useContext(AppContext);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0, avgPerDay: 0 });
  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, AnalyticsService, ConsultationService]);

  const loadAnalytics = () => {
    const days = parseInt(dateRange);
    const total = AnalyticsService.totalConsultations();
    const thisWeek = AnalyticsService.recentCount(7);
    const thisMonth = AnalyticsService.recentCount(30);

    setStats({
      total,
      thisWeek,
      thisMonth,
      avgPerDay: days > 0 ? (AnalyticsService.recentCount(days) / days).toFixed(1) : 0,
    });

    // Daily data for line chart
    const trends = AnalyticsService.trendsOverTime(days);
    // Fill in missing days
    const filled = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const existing = trends.find(t => t.date === dateStr);
      filled.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: existing ? existing.count : 0,
      });
    }
    setDailyData(filled);

    // Weekly bar chart by type
    const consultations = ConsultationService.getAll();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const recent = consultations.filter(c => new Date(c.date) >= cutoff);

    // Group by week
    const weeks = {};
    recent.forEach(c => {
      const d = new Date(c.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const weekKey = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!weeks[weekKey]) weeks[weekKey] = { week: weekKey, chat: 0, search: 0, interaction: 0 };
      const type = c.type || "chat";
      if (weeks[weekKey][type] !== undefined) weeks[weekKey][type]++;
    });
    setWeeklyData(Object.values(weeks).slice(-6));

    // Pie chart
    const breakdown = AnalyticsService.categoryBreakdown();
    if (breakdown.length > 0) {
      setPieData(breakdown);
    } else {
      setPieData([{ name: "No data", value: 1 }]);
    }

    // Activity area chart
    const activityTrends = AnalyticsService.trendsOverTime(days);
    const actFilled = [];
    for (let i = Math.min(days, 14) - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const existing = activityTrends.find(t => t.date === dateStr);
      actFilled.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        activity: existing ? existing.count : 0,
      });
    }
    setActivityData(actFilled);
  };

  return (
    <div className="an-page">
      <div className="an-header">
        <div>
          <h1 className="an-title">Analytics</h1>
          <p className="an-subtitle">Detailed insights into your health consultations</p>
        </div>
        <div className="an-date-select">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="an-stats">
        <div className="an-stat-card">
          <div className="an-stat-icon an-stat-blue"><TrendingUp size={18} /></div>
          <div className="an-stat-body">
            <span className="an-stat-label">Total Consultations</span>
            <span className="an-stat-value">{stats.total}</span>
          </div>
        </div>
        <div className="an-stat-card">
          <div className="an-stat-icon an-stat-green"><Activity size={18} /></div>
          <div className="an-stat-body">
            <span className="an-stat-label">This Week</span>
            <span className="an-stat-value">{stats.thisWeek}</span>
          </div>
        </div>
        <div className="an-stat-card">
          <div className="an-stat-icon an-stat-amber"><BarChart3 size={18} /></div>
          <div className="an-stat-body">
            <span className="an-stat-label">This Month</span>
            <span className="an-stat-value">{stats.thisMonth}</span>
          </div>
        </div>
        <div className="an-stat-card">
          <div className="an-stat-icon an-stat-rose"><PieIcon size={18} /></div>
          <div className="an-stat-body">
            <span className="an-stat-label">Avg/Day</span>
            <span className="an-stat-value">{stats.avgPerDay}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="an-charts-grid">
        {/* Line chart - daily */}
        <div className="an-chart-card an-chart-wide">
          <h3 className="an-chart-title">Daily Consultations</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#5c6080", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#5c6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#4f8cff" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#4f8cff" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart - weekly by type */}
        <div className="an-chart-card">
          <h3 className="an-chart-title">Weekly by Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: "#5c6080", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#5c6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="chat" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="search" fill="#4f8cff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="interaction" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart - type distribution */}
        <div className="an-chart-card">
          <h3 className="an-chart-title">Type Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                dataKey="value"
                nameKey="name"
                paddingAngle={2}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Area chart - activity trends */}
        <div className="an-chart-card an-chart-wide">
          <h3 className="an-chart-title">Activity Trends</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#5c6080", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#5c6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="activity" stroke="#10b981" strokeWidth={2} fill="url(#actGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
