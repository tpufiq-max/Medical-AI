import { useState, useRef } from "react";
import "./Search.css";

const API = "http://localhost:5001";

export default function Search() {
  const [med, setMed]           = useState("");
  const [data, setData]         = useState(null);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [scanning, setScanning] = useState(false);
  const [fileName, setFileName] = useState("");
  const inputRef                = useRef(null);

  // ─── helpers ────────────────────────────────────────────────────
  const reset = () => { setData(null); setError(""); };

  const doSearch = async (searchName) => {
    const name = (searchName || med).trim();
    if (!name) return;
    setLoading(true);
    reset();
    try {
      const res = await fetch(`${API}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.toLowerCase() }),
      });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Server error");
      // Backend may return array (DB) or single object (AI)
      setData(Array.isArray(json) ? json[0] : json);
    } catch (e) {
      setError(e.message || "Unable to fetch medicine details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── image OCR ──────────────────────────────────────────────────
  const handleImage = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setScanning(true);
    reset();

    const form = new FormData();
    form.append("image", file);

    try {
      const res  = await fetch(`${API}/analyze-image`, { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || "Scan failed");

      const name = json.name || json?.data?.name;
      if (name) {
        setMed(name);
        await doSearch(name);
      } else {
        setError("Could not detect medicine name. Please type it manually.");
      }
    } catch (e) {
      setError(e.message || "Image scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const busy = loading || scanning;

  // ─── render ─────────────────────────────────────────────────────
  return (
    <div className="sr-root">
      {/* ambient blobs */}
      <div className="sr-blob sr-blob1" />
      <div className="sr-blob sr-blob2" />
      <div className="sr-blob sr-blob3" />

      <div className="sr-shell">

        {/* ── HEADER ── */}
        <header className="sr-header">
          <div className="sr-header-pill">
            <span className="sr-header-dot" />
            MEDICINE FINDER
          </div>
          <h1 className="sr-title">
            Search any<br /><em>medicine</em> instantly
          </h1>
          <p className="sr-subtitle">
            Usage · Dosage · Side effects · Warnings — powered by AI + live database
          </p>
        </header>

        {/* ── SEARCH ── */}
        <div className="sr-search-wrap">
          <div className="sr-search-inner">
            <IcSearch />
            <input
              ref={inputRef}
              className="sr-input"
              placeholder="e.g. Paracetamol, Ibuprofen, Amoxicillin…"
              value={med}
              onChange={(e) => setMed(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              disabled={busy}
              autoComplete="off"
            />
            {med && !busy && (
              <button className="sr-clear" onClick={() => { setMed(""); reset(); setFileName(""); inputRef.current?.focus(); }}>
                <IcX />
              </button>
            )}
          </div>
          <button className="sr-btn-search" onClick={() => doSearch()} disabled={busy || !med.trim()}>
            {loading ? <><span className="sr-spin" />Searching</> : "Search →"}
          </button>
        </div>

        {/* ── DIVIDER ── */}
        <div className="sr-or"><span>or scan a label</span></div>

        {/* ── UPLOAD ── */}
        <label className={`sr-upload ${busy ? "sr-upload--busy" : ""}`}>
          <div className="sr-upload-left">
            <div className="sr-upload-icon"><IcCamera /></div>
            <div>
              <p className="sr-upload-title">Scan medicine label</p>
              <p className="sr-upload-hint">Upload a photo — we'll read the name automatically</p>
            </div>
          </div>
          <span className="sr-upload-cta">
            {scanning ? <><span className="sr-spin sr-spin--sm" />Scanning…</> : <><IcUpload />Upload</>}
          </span>
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={busy}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); e.target.value = ""; }}
          />
        </label>

        {fileName && !scanning && (
          <p className="sr-scanned">✦ Scanned: <b>{fileName}</b></p>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div className="sr-error">
            <IcWarn />
            <span>{error}</span>
          </div>
        )}

        {/* ── SKELETON ── */}
        {busy && !error && (
          <div className="sr-skeleton-wrap">
            {[1,2,3,4].map(i => (
              <div key={i} className="sr-skeleton-card">
                <div className="sr-skeleton sr-sk-title" />
                <div className="sr-skeleton sr-sk-line" />
                <div className="sr-skeleton sr-sk-line sr-sk-short" />
              </div>
            ))}
          </div>
        )}

        {/* ── EMPTY ── */}
        {!data && !error && !busy && (
          <div className="sr-empty">
            <div className="sr-empty-glyph">⌬</div>
            <p className="sr-empty-title">Ready to search</p>
            <p className="sr-empty-body">Type a medicine name above or upload a label photo</p>
            <div className="sr-chips">
              {["Paracetamol","Ibuprofen","Amoxicillin","Metformin"].map(s => (
                <button key={s} className="sr-chip" onClick={() => { setMed(s); doSearch(s); }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {data && !error && !busy && (
          <div className="sr-result">
            {/* result header */}
            <div className="sr-result-head">
              <div className="sr-result-badge">RESULT</div>
              <h2 className="sr-result-name">{data.name}</h2>
              <p className="sr-result-sub">Medicine overview &amp; clinical details</p>
            </div>

            <div className="sr-cards">
              <InfoCard icon="🩺" label="Uses"         value={data.uses} />
              <InfoCard icon="📏" label="Dosage"       value={data.dosage} accent="blue" />
              <InfoCard icon="⚠️" label="Side Effects" value={data.side_effects} accent="amber" />
              <InfoCard icon="🚨" label="Warnings"     value={data.warnings} accent="red" />
            </div>

            {(data.mechanism || data.onset || data.duration) && (
              <div className="sr-card sr-extra">
                <p className="sr-extra-head">Additional Information</p>
                <div className="sr-extra-row">
                  {data.mechanism && <ExtraItem label="Mechanism" val={data.mechanism} />}
                  {data.onset     && <ExtraItem label="Onset"     val={data.onset} />}
                  {data.duration  && <ExtraItem label="Duration"  val={data.duration} />}
                </div>
              </div>
            )}

            <p className="sr-disclaimer">
              ⚕ AI-generated information. Always consult a licensed healthcare professional.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── sub-components ─────────────────────────────────────────────────────────

function InfoCard({ icon, label, value, accent }) {
  if (!value) return null;
  return (
    <div className={`sr-card sr-info ${accent ? `sr-info--${accent}` : ""}`}>
      <div className="sr-info-head">
        <span className="sr-info-icon">{icon}</span>
        <span className="sr-info-label">{label}</span>
      </div>
      {Array.isArray(value)
        ? <ul className="sr-info-list">{value.map((v, i) => <li key={i}>{v}</li>)}</ul>
        : <p className="sr-info-text">{value}</p>}
    </div>
  );
}

function ExtraItem({ label, val }) {
  return (
    <div className="sr-extra-item">
      <span className="sr-extra-label">{label}</span>
      <span className="sr-extra-val">{val}</span>
    </div>
  );
}

// ─── icons ───────────────────────────────────────────────────────────────────
const IcSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcX = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);
const IcUpload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IcWarn = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);