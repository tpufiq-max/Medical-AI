import { useContext, useState, useEffect } from "react";
import { AppContext } from "../context";
import { t } from "../translations";
import { ConsultationService } from "../services/dataService";
import "./Consultations.css";

export default function Consultations() {
  const { lang } = useContext(AppContext);
  const [consultations, setConsultations] = useState([]);
  const [stats, setStats] = useState({ total: 0, byType: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const allConsultations = await ConsultationService.getAll();
        const statsData = await ConsultationService.getStats();

        if (isMounted) {
          setConsultations(allConsultations);
          setStats(statsData);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching consultations:", error);
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

  return (
    <div className="consultations-container">
      <div className="consult-bg">
        <div className="consult-blob consult-blob-a"></div>
        <div className="consult-blob consult-blob-b"></div>
      </div>

      <div className="consult-header">
        <h1 className="consult-title">{t[lang].consultations}</h1>
      </div>

      <div className="consult-stats">
        <div className="consult-stat-card">
          <div className="consult-stat-number">{stats.total}</div>
          <div className="consult-stat-label">Total Consultations</div>
        </div>
        {Object.entries(stats.byType).map(([type, count]) => (
          <div key={type} className="consult-stat-card">
            <div className="consult-stat-number">{count}</div>
            <div className="consult-stat-label">{type} Type</div>
          </div>
        ))}
      </div>

      <div className="consult-list-section">
        <h2 className="consult-section-title">Recent Consultations</h2>
        {consultations.length === 0 ? (
          <div className="consult-empty">
            No consultations yet. Start by having a conversation with the chatbot.
          </div>
        ) : (
          <div className="consult-list">
            {consultations.slice(0, 10).map((consultation) => (
              <div key={consultation.id} className="consult-card">
                <div className="consult-card-header">
                  <div className="consult-card-type">{consultation.type}</div>
                  <div className="consult-card-date">
                    {new Date(consultation.date).toLocaleString()}
                  </div>
                </div>
                <div className="consult-card-query">
                  <div className="consult-card-query-label">Query</div>
                  <div className="consult-card-query-text">{consultation.query}</div>
                </div>
                {consultation.diagnosis && (
                  <div className="consult-card-diagnosis">
                    <div className="consult-card-diagnosis-label">Diagnosis</div>
                    <div className="consult-card-diagnosis-text">{consultation.diagnosis}</div>
                  </div>
                )}
                {consultation.recommendations && consultation.recommendations.length > 0 && (
                  <div className="consult-card-recommendations">
                    <div className="consult-card-recommendations-label">Recommendations</div>
                    <ul className="consult-recommendations-list">
                      {consultation.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
