import { useContext, useState, useEffect } from "react";
import { AppContext } from "../context";
import { Search, Plus, Trash2, X, FileText, ClipboardList, Stethoscope, Pill } from "lucide-react";
import "./MedicalHistory.css";

const TABS = [
  { key: "all", label: "All", icon: FileText },
  { key: "report", label: "Reports", icon: FileText },
  { key: "prescription", label: "Prescriptions", icon: Pill },
  { key: "diagnosis", label: "Diagnoses", icon: Stethoscope },
  { key: "treatment", label: "Treatments", icon: ClipboardList },
];

export default function MedicalHistory() {
  const { MedicalRecordService } = useContext(AppContext);
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({ title: "", type: "report", content: "", tags: "" });

  const loadRecords = () => {
    setRecords(MedicalRecordService.getAll());
  };

  useEffect(() => { loadRecords(); }, [MedicalRecordService]);

  const filtered = records.filter(r => {
    if (activeTab !== "all" && r.type !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (r.title && r.title.toLowerCase().includes(q)) ||
        (r.content && r.content.toLowerCase().includes(q)) ||
        (r.tags && r.tags.some(t => t.toLowerCase().includes(q)));
    }
    return true;
  });

  const handleAdd = () => {
    if (!formData.title.trim()) return;
    MedicalRecordService.save({
      title: formData.title,
      type: formData.type,
      content: formData.content,
      tags: formData.tags.split(",").map(t => t.trim()).filter(Boolean),
    });
    setFormData({ title: "", type: "report", content: "", tags: "" });
    setShowModal(false);
    loadRecords();
  };

  const handleDelete = (id) => {
    MedicalRecordService.delete(id);
    setDeleteConfirm(null);
    loadRecords();
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "report": return "mh-type-blue";
      case "prescription": return "mh-type-green";
      case "diagnosis": return "mh-type-amber";
      case "treatment": return "mh-type-rose";
      default: return "mh-type-blue";
    }
  };

  return (
    <div className="mh-page">
      <div className="mh-header">
        <div>
          <h1 className="mh-title">Medical History</h1>
          <p className="mh-subtitle">Manage your medical records</p>
        </div>
        <button className="mh-add-btn" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Record
        </button>
      </div>

      {/* Tabs */}
      <div className="mh-tabs">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`mh-tab ${activeTab === tab.key ? "mh-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mh-search-wrap">
        <Search size={16} className="mh-search-icon" />
        <input
          type="text"
          className="mh-search-input"
          placeholder="Search records..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Records */}
      {filtered.length === 0 ? (
        <div className="mh-empty">
          <div className="mh-empty-icon">📋</div>
          <h3>No records found</h3>
          <p>{activeTab === "all" ? "Add your first medical record to get started." : `No ${activeTab} records yet.`}</p>
        </div>
      ) : (
        <div className="mh-grid">
          {filtered.map(record => (
            <div key={record.id} className="mh-card">
              <div className="mh-card-head">
                <span className={`mh-type-badge ${getTypeColor(record.type)}`}>{record.type}</span>
                <span className="mh-card-date">{formatDate(record.date)}</span>
              </div>
              <h3 className="mh-card-title">{record.title}</h3>
              <p className="mh-card-content">{record.content ? record.content.slice(0, 120) + (record.content.length > 120 ? "..." : "") : "No content"}</p>
              {record.tags && record.tags.length > 0 && (
                <div className="mh-card-tags">
                  {record.tags.map((tag, i) => <span key={i} className="mh-tag">{tag}</span>)}
                </div>
              )}
              <button className="mh-delete-btn" onClick={() => setDeleteConfirm(record.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="mh-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="mh-modal" onClick={e => e.stopPropagation()}>
            <div className="mh-modal-head">
              <h2>Add Medical Record</h2>
              <button className="mh-modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="mh-modal-body">
              <div className="mh-field">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Record title..."
                />
              </div>
              <div className="mh-field">
                <label>Type</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option value="report">Report</option>
                  <option value="prescription">Prescription</option>
                  <option value="diagnosis">Diagnosis</option>
                  <option value="treatment">Treatment</option>
                </select>
              </div>
              <div className="mh-field">
                <label>Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Record details..."
                  rows={5}
                />
              </div>
              <div className="mh-field">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. cardiology, routine"
                />
              </div>
            </div>
            <div className="mh-modal-footer">
              <button className="mh-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="mh-btn-save" onClick={handleAdd}>Save Record</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="mh-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="mh-modal mh-modal-sm" onClick={e => e.stopPropagation()}>
            <div className="mh-modal-head">
              <h2>Delete Record</h2>
            </div>
            <div className="mh-modal-body">
              <p>Are you sure you want to delete this record? This action cannot be undone.</p>
            </div>
            <div className="mh-modal-footer">
              <button className="mh-btn-cancel" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="mh-btn-delete" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
