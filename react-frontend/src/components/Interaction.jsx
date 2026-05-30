import { useState } from "react";
import "./Interaction.css";

const API = "http://localhost:5001";

export default function Interaction() {
  const [drug1, setDrug1]   = useState("");
  const [drug2, setDrug2]   = useState("");
  const [file1, setFile1]   = useState(null);
  const [file2, setFile2]   = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(0); // 1 or 2
  const [error, setError]   = useState("");

  // ─── severity config ────────────────────────────────────────────
  const severityMap = {
    High:     { cls: "sev-high",     icon: "🔴", label: "High Risk",     bar: 100 },
    Moderate: { cls: "sev-moderate", icon: "🟡", label: "Moderate Risk", bar: 60  },
    Low:      { cls: "sev-low",      icon: "🟢", label: "Low Risk",      bar: 25  },
    None:     { cls: "sev-none",     icon: "✅", label: "No Risk",       bar: 0   },
    Unknown:  { cls: "sev-unknown",  icon: "❓", label: "Unknown",       bar: 50  },
  };
  const sev = result?.severity ? (severityMap[result.severity] || severityMap.Unknown) : null;

  // ─── scan image ─────────────────────────────────────────────────
  const scanImage = async (file, slot) => {
    if (!file) return;
    setScanning(slot);
    setError("");
    const form = new FormData();
    form.append("image", file);
    try {
      const res  = await fetch(`${API}/analyze-image`, { method: "POST", body: form });
      const data = await res.json();
      const name = data?.name || data?.data?.name;
      if (name) {
        slot === 1 ? setDrug1(name) : setDrug2(name);
      } else {
        setError(`Could not read medicine ${slot} from image. Please type it manually.`);
      }
    } catch {
      setError("Image scan failed. Please try again.");
    } finally {
      setScanning(0);
    }
  };

  // ─── check interaction ───────────────────────────────────────────
  const checkInteraction = async () => {
    setError("");
    setResult(null);
    if (!drug1.trim() || !drug2.trim()) {
      setError("Please enter both medicine names before checking.");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/interaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drug1: drug1.trim(), drug2: drug2.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Server error");
      setResult(data);
    } catch (e) {
      setError(e.message || "Server error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const busy = loading || scanning > 0;

  return (
    <div className="ia-root">
      {/* ambient blobs */}
      <div className="ia-blob ia-blob1" />
      <div className="ia-blob ia-blob2" />

      <div className="ia-shell">

        {/* ── HEADER ── */}
        <header className="ia-header">
          <div className="ia-header-pill">
            <span className="ia-header-dot" />
            DRUG INTERACTION CHECKER
          </div>
          <h1 className="ia-title">
            Check if two<br /><em>medicines</em> are safe
          </h1>
          <p className="ia-subtitle">
            Enter or scan two medicines to detect potential interactions instantly
          </p>
        </header>

        {/* ── INPUT CARD ── */}
        <div className="ia-card">

          <div className="ia-drug-row">

            {/* Drug 1 */}
            <DrugSlot
              slot={1}
              label="MEDICINE 1"
              dotCls="dot-blue"
              placeholder="e.g. Aspirin"
              value={drug1}
              onChange={setDrug1}
              file={file1}
              setFile={setFile1}
              scanning={scanning === 1}
              busy={busy}
              onScan={(f) => { setFile1(f); scanImage(f, 1); }}
              onKey={(e) => e.key === "Enter" && checkInteraction()}
            />

            {/* VS */}
            <div className="ia-vs">
              <div className="ia-vs-ring">VS</div>
            </div>

            {/* Drug 2 */}
            <DrugSlot
              slot={2}
              label="MEDICINE 2"
              dotCls="dot-purple"
              placeholder="e.g. Ibuprofen"
              value={drug2}
              onChange={setDrug2}
              file={file2}
              setFile={setFile2}
              scanning={scanning === 2}
              busy={busy}
              onScan={(f) => { setFile2(f); scanImage(f, 2); }}
              onKey={(e) => e.key === "Enter" && checkInteraction()}
            />
          </div>

          {/* error */}
          {error && (
            <div className="ia-error">
              <IcWarn /> <span>{error}</span>
            </div>
          )}

          {/* check button */}
          <button className="ia-btn" onClick={checkInteraction} disabled={busy}>
            {loading
              ? <><span className="ia-spin" /> Analyzing…</>
              : "Check Interaction →"}
          </button>
        </div>

        {/* ── RESULT ── */}
        {result && !result.error && (
          <div className={`ia-result ${sev?.cls || ""}`}>

            {/* result header */}
            <div className="ia-result-top">
              <div>
                <div className="ia-result-badge">RESULT</div>
                <p className="ia-result-drugs">
                  <strong>{drug1}</strong>
                  <span className="ia-x">×</span>
                  <strong>{drug2}</strong>
                </p>
              </div>
              <div className={`ia-sev-pill ${sev?.cls}`}>
                {sev?.icon} {sev?.label}
              </div>
            </div>

            {/* severity bar */}
            <div className="ia-sev-track">
              <div className="ia-sev-bar" style={{ width: `${sev?.bar ?? 50}%` }} />
            </div>

            {/* interaction flag */}
            <div className="ia-flag-row">
              <span className="ia-flag-label">Interaction detected</span>
              <span className={`ia-flag-val ${result.interaction === "Yes" ? "flag-yes" : "flag-no"}`}>
                {result.interaction === "Yes" ? "⚠ Yes — Caution Advised" : "✓ No Interaction Found"}
              </span>
            </div>

            <div className="ia-sep" />

            {/* details */}
            <div className="ia-details">
              <Detail icon="🧬" label="Clinical Effect" val={result.clinical_effect} />
              <Detail icon="⚙️" label="Mechanism"       val={result.mechanism} />
              <Detail icon="💡" label="Advice"          val={result.advice} highlight />
              <Detail icon="📊" label="Monitoring"      val={result.monitoring} />
            </div>

            <p className="ia-disclaimer">
              ⚕ AI-generated information. Not a substitute for professional medical advice.
            </p>
          </div>
        )}

        {/* result-level error */}
        {result?.error && (
          <div className="ia-error ia-error--card">
            <IcWarn /> <span>{result.error}</span>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── DrugSlot ────────────────────────────────────────────────────────────────
function DrugSlot({ label, dotCls, placeholder, value, onChange, file, scanning, busy, onScan, onKey }) {
  return (
    <div className="ia-drug-col">
      <div className="ia-col-label">
        <span className={`ia-dot ${dotCls}`} />
        <span>{label}</span>
      </div>
      <input
        className="ia-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKey}
        disabled={busy}
      />
      <label className={`ia-scan-btn ${scanning ? "ia-scan-btn--active" : ""} ${busy ? "ia-scan-btn--busy" : ""}`}>
        {scanning
          ? <><span className="ia-spin ia-spin--sm" /> Scanning…</>
          : file
            ? <><IcCheck /> <span className="ia-file-name">{file.name}</span></>
            : <><IcCamera /> Scan Label</>}
        <input
          type="file"
          accept="image/*"
          hidden
          disabled={busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onScan(f); e.target.value = ""; }}
        />
      </label>
    </div>
  );
}

// ─── Detail block ─────────────────────────────────────────────────────────────
function Detail({ icon, label, val, highlight }) {
  if (!val) return null;
  return (
    <div className={`ia-detail ${highlight ? "ia-detail--hi" : ""}`}>
      <div className="ia-detail-head">
        <span className="ia-detail-icon">{icon}</span>
        <span className="ia-detail-label">{label}</span>
      </div>
      <p className="ia-detail-val">{val}</p>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcWarn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcCamera = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IcCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);