import { useContext, useState, useMemo } from "react";
import { AppContext } from "../context";
import { FileText, Download, Eye, Calendar, X, ChevronDown, ChevronUp } from "lucide-react";
import "./Reports.css";

export default function Reports() {
  const { ConsultationService } = useContext(AppContext);
  const [expandedId, setExpandedId] = useState(null);

  const reports = useMemo(() => {
    const consultations = ConsultationService.getAll();
    const generated = [];

    // Monthly summary reports
    const monthlyGroups = {};
    consultations.forEach(c => {
      const month = c.date ? c.date.slice(0, 7) : "unknown";
      if (!monthlyGroups[month]) monthlyGroups[month] = [];
      monthlyGroups[month].push(c);
    });

    Object.entries(monthlyGroups).forEach(([month, items]) => {
      const d = new Date(month + "-01");
      const monthName = d.toLocaleString("default", { month: "long", year: "numeric" });
      const types = {};
      items.forEach(c => { types[c.type] = (types[c.type] || 0) + 1; });

      generated.push({
        id: `monthly-${month}`,
        title: `Monthly Summary - ${monthName}`,
        type: "monthly",
        dateRange: `${month}-01 to ${month}-28`,
        date: `${month}-01`,
        summary: `${items.length} consultations: ${Object.entries(types).map(([t, c]) => `${c} ${t}`).join(", ")}`,
        content: buildMonthlyContent(monthName, items, types),
        consultationCount: items.length,
      });
    });

    // Overall consultation report
    if (consultations.length > 0) {
      const types = {};
      consultations.forEach(c => { types[c.type] = (types[c.type] || 0) + 1; });
      generated.unshift({
        id: "overall-summary",
        title: "Overall Consultation Report",
        type: "summary",
        dateRange: "All time",
        date: new Date().toISOString().slice(0, 10),
        summary: `Total: ${consultations.length} consultations across ${Object.keys(types).length} types`,
        content: buildOverallContent(consultations, types),
        consultationCount: consultations.length,
      });
    }

    return generated;
  }, [ConsultationService.getAll().length]);

  const buildMonthlyContent = (monthName, items, types) => {
    let content = `MONTHLY CONSULTATION REPORT\n`;
    content += `Period: ${monthName}\n`;
    content += `Total Consultations: ${items.length}\n\n`;
    content += `BREAKDOWN BY TYPE:\n`;
    Object.entries(types).forEach(([type, count]) => {
      content += `  - ${type}: ${count}\n`;
    });
    content += `\nDETAILS:\n`;
    items.forEach((item, i) => {
      content += `\n${i + 1}. [${item.type.toUpperCase()}] ${item.query || "N/A"}\n`;
      if (item.diagnosis) content += `   Diagnosis: ${item.diagnosis}\n`;
      content += `   Date: ${new Date(item.date).toLocaleDateString()}\n`;
    });
    return content;
  };

  const buildOverallContent = (consultations, types) => {
    let content = `OVERALL CONSULTATION REPORT\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n`;
    content += `Total Records: ${consultations.length}\n\n`;
    content += `TYPE DISTRIBUTION:\n`;
    Object.entries(types).forEach(([type, count]) => {
      const pct = ((count / consultations.length) * 100).toFixed(1);
      content += `  - ${type}: ${count} (${pct}%)\n`;
    });
    content += `\nRECENT CONSULTATIONS (Last 10):\n`;
    consultations.slice(0, 10).forEach((c, i) => {
      content += `\n${i + 1}. [${c.type.toUpperCase()}] ${c.query || "N/A"}\n`;
      content += `   Date: ${new Date(c.date).toLocaleDateString()}\n`;
      if (c.diagnosis) content += `   Diagnosis: ${c.diagnosis}\n`;
    });
    return content;
  };

  const handleDownload = (report) => {
    const blob = new Blob([report.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "monthly": return "rp-type-blue";
      case "summary": return "rp-type-emerald";
      default: return "rp-type-blue";
    }
  };

  return (
    <div className="rp-page">
      <div className="rp-header">
        <div>
          <h1 className="rp-title">Reports</h1>
          <p className="rp-subtitle">Generated reports from your consultation data</p>
        </div>
        <span className="rp-count">{reports.length} reports</span>
      </div>

      {reports.length === 0 ? (
        <div className="rp-empty">
          <div className="rp-empty-icon">📊</div>
          <h3>No reports available</h3>
          <p>Reports are generated automatically from your consultation history. Start using the chatbot or medicine search to build your data.</p>
        </div>
      ) : (
        <div className="rp-list">
          {reports.map(report => (
            <div key={report.id} className={`rp-card ${expandedId === report.id ? "rp-card-expanded" : ""}`}>
              <div className="rp-card-main">
                <div className="rp-card-icon">
                  <FileText size={20} />
                </div>
                <div className="rp-card-info">
                  <div className="rp-card-top">
                    <h3 className="rp-card-title">{report.title}</h3>
                    <span className={`rp-type-badge ${getTypeColor(report.type)}`}>{report.type}</span>
                  </div>
                  <p className="rp-card-summary">{report.summary}</p>
                  <div className="rp-card-meta">
                    <span className="rp-meta-item"><Calendar size={12} /> {report.dateRange}</span>
                    <span className="rp-meta-item">{report.consultationCount} consultations</span>
                  </div>
                </div>
                <div className="rp-card-actions">
                  <button className="rp-btn-icon" onClick={() => setExpandedId(expandedId === report.id ? null : report.id)} title="View">
                    {expandedId === report.id ? <ChevronUp size={16} /> : <Eye size={16} />}
                  </button>
                  <button className="rp-btn-icon rp-btn-download" onClick={() => handleDownload(report)} title="Download">
                    <Download size={16} />
                  </button>
                </div>
              </div>

              {expandedId === report.id && (
                <div className="rp-card-detail">
                  <div className="rp-detail-head">
                    <h4>Report Content</h4>
                    <button className="rp-btn-close" onClick={() => setExpandedId(null)}><X size={14} /></button>
                  </div>
                  <pre className="rp-detail-content">{report.content}</pre>
                  <div className="rp-detail-footer">
                    <button className="rp-btn-download-full" onClick={() => handleDownload(report)}>
                      <Download size={14} /> Download as .txt
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
