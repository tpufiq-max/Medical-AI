import { useContext, useState, useEffect } from "react";
import { AppContext } from "../context";
import { t } from "../translations";
import { ConsultationService, AnalyticsService } from "../services/dataService";
import "./Analytics.css";

export default function Analytics() {
  const { lang } = useContext(AppContext);
  const [analytics, setAnalytics] = useState({
    totalConsultations: 0,
    monthlyStats: [],
    consultationTypes: {},
  });
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const updateAnalytics = async () => {
      try {
        const total = await ConsultationService.getAll();
        const monthly = await ConsultationService.getMonthlyStats();
        const stats = await ConsultationService.getStats();

        if (isMounted) {
          setAnalytics({
            totalConsultations: total.length,
            monthlyStats: monthly,
            consultationTypes: stats.byType,
          });
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
        if (isMounted) setLoading(false);
      }
    };

    updateAnalytics();

    // Poll for updates every 5 seconds
    const interval = setInterval(updateAnalytics, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const months = analytics.monthlyStats.map(m => m.month);
  const monthlyCounts = analytics.monthlyStats.map(m => m.count);
  const typeNames = Object.keys(analytics.consultationTypes);
  const typeCounts = Object.values(analytics.consultationTypes);

  return (
    <div className="analytics-container">
      <div className="analytics-bg">
        <div className="analytics-blob analytics-blob-a"></div>
        <div className="analytics-blob analytics-blob-b"></div>
      </div>

      <div className="analytics-header">
        <h1 className="analytics-title">{t[lang].analytics}</h1>
      </div>

      {analytics.totalConsultations === 0 ? (
        <div className="analytics-empty">
          Analytics and insights will appear here as you use the system.
        </div>
      ) : (
        <div>
          {/* Key Metrics */}
          <div className="analytics-section">
            <h2 className="analytics-section-title">Key Metrics</h2>
            <div className="analytics-metrics">
              <div className="analytics-metric">
                <div className="analytics-metric-number">
                  {analytics.totalConsultations}
                </div>
                <div className="analytics-metric-label">Total Consultations</div>
              </div>

              <div className="analytics-metric">
                <div className="analytics-metric-number">
                  {Object.keys(analytics.consultationTypes).length}
                </div>
                <div className="analytics-metric-label">Consultation Types</div>
              </div>

              <div className="analytics-metric">
                <div className="analytics-metric-number">
                  {analytics.monthlyStats.length}
                </div>
                <div className="analytics-metric-label">Active Months</div>
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="analytics-section">
            <h2 className="analytics-section-title">Monthly Activity Trend</h2>
            {analytics.monthlyStats.length > 0 ? (
              <div className="analytics-section-card">
                <div className="analytics-chart">
                  {analytics.monthlyStats.map((month, idx) => {
                    const maxCount = Math.max(...analytics.monthlyStats.map(m => m.count), 1);
                    const height = ((month.count / maxCount) * 200 + 50);
                    return (
                      <div
                        key={month.month}
                        className="analytics-bar"
                        style={{ height: `${height}px` }}
                        onClick={() => setSelectedMonth(month.month)}
                      >
                        {month.count > 0 && (
                          <div className="analytics-bar-value">{month.count}</div>
                        )}
                        <div className="analytics-bar-label">{month.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>
                No monthly data available yet.
              </p>
            )}
          </div>

          {/* Consultation Types Distribution */}
          <div className="analytics-section">
            <h2 className="analytics-section-title">
              Consultation Types Distribution
            </h2>
            {Object.keys(analytics.consultationTypes).length > 0 ? (
              <div className="analytics-distribution">
                {Object.entries(analytics.consultationTypes).map(([type, count]) => {
                  const percentage =
                    (count / analytics.totalConsultations) * 100;
                  return (
                    <div key={type} className="analytics-distribution-item">
                      <div className="analytics-distribution-title">{type}</div>
                      <div className="analytics-distribution-number">{count}</div>
                      <div className="analytics-progress-bar">
                        <div className="analytics-progress-track">
                          <div
                            className="analytics-progress-fill"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="analytics-progress-label">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: "var(--text-secondary)" }}>
                No consultation type data available yet.
              </p>
            )}
          </div>

          {/* Selected Month Details */}
          {selectedMonth && (
            <div className="analytics-details">
              <div className="analytics-details-title">
                Details for {selectedMonth}
              </div>
              <div className="analytics-details-value">
                {analytics.monthlyStats.find(m => m.month === selectedMonth)
                  ?.count || 0}{" "}
                consultations
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
