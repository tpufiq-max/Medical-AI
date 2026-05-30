import { useState, useRef, useEffect, useCallback, useContext } from "react";
import { AppContext } from "../context";
import "./chat.css";

const API = "http://localhost:5001";

function Chatbot() {
  const { ConsultationService, ActivityLogService } = useContext(AppContext);
  const [msg, setMsg]           = useState("");
  const [chat, setChat]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceOn, setVoiceOn]   = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const endRef       = useRef(null);
  const abortRef     = useRef(null);   // AbortController for SSE
  const textareaRef  = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [msg]);

  const getTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ─── Build conversation history for context ──────────────
  const buildHistory = () =>
    chat
      .filter(c => c.role === "user" || c.role === "assistant")
      .map(c => ({ role: c.role, content: c.text || c.streamedText || "" }));

  // ─── VOICE INPUT ────────────────────────────────────────
  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Please use Chrome for voice input."); return; }
    const recog = new SR();
    recog.lang = "en-US";
    setListening(true);
    recog.start();
    recog.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setListening(false);
      setTimeout(() => sendMessage(text), 300);
    };
    recog.onerror = () => { setListening(false); alert("Microphone permission denied."); };
    recog.onend   = () => setListening(false);
  };

  // ─── SPEECH SYNTHESIS ───────────────────────────────────
  const playVoice = (text) => {
    if (!voiceOn) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = "en-US";
    utter.rate  = 1;
    utter.onstart = () => setSpeaking(true);
    utter.onend   = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  // ─── STOP STREAMING ─────────────────────────────────────
  const stopStream = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setStreaming(false);
    setLoading(false);
    // Mark the last streaming message as complete
    setChat(prev => prev.map((c, i) =>
      i === prev.length - 1 && c.role === "assistant" && c.isStreaming
        ? { ...c, isStreaming: false }
        : c
    ));
  };

  // ─── FETCH SIMILAR MEDICINES ────────────────────────────
  const fetchSimilar = async (medName) => {
    try {
      const res  = await fetch(`${API}/similar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: medName }),
      });
      const data = await res.json();
      return data?.similar || [];
    } catch {
      return [];
    }
  };

  // ─── SEND MESSAGE (streaming) ───────────────────────────
  const sendMessage = useCallback(async (voiceText) => {
    const message = (voiceText ?? msg).trim();
    if (!message || loading || streaming) return;

    // Add user bubble
    setChat(prev => [...prev, { role: "user", text: message, time: getTime() }]);
    setMsg("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: buildHistory() }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";
      let   msgId   = Date.now();
      let   isMedicineCard = false;

      setLoading(false);
      setStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let event;
          try { event = JSON.parse(raw); } catch { continue; }

          if (event.type === "token") {
            // Append token to streaming assistant bubble
            setChat(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant" && last?.id === msgId) {
                return prev.map((c, i) =>
                  i === prev.length - 1
                    ? { ...c, streamedText: (c.streamedText || "") + event.content }
                    : c
                );
              }
              // Create the bubble on first token
              return [
                ...prev,
                { role: "assistant", id: msgId, streamedText: event.content, isStreaming: true, time: getTime() },
              ];
            });
          }

          else if (event.type === "medicine") {
            isMedicineCard = true;
            const med     = event.data;
            const similar = await fetchSimilar(med.name);
            setChat(prev => [
              ...prev,
              { role: "ai", id: msgId, data: med, similar, time: getTime() },
            ]);
            const speech = `${med.name}. Uses: ${Array.isArray(med.uses) ? med.uses.join(", ") : med.uses}.`;
            setTimeout(() => playVoice(speech), 300);
            // Save consultation and log activity
            try {
              ConsultationService.save({ type: 'chat', query: message, response: med, diagnosis: med.name });
              ActivityLogService.log('chat_medicine', `Medicine info: ${med.name}`, 'chat');
            } catch {}
          }

          else if (event.type === "done") {
            if (!isMedicineCard) {
              // Finalise the streaming bubble
              setChat(prev => prev.map((c, i) =>
                i === prev.length - 1 && c.role === "assistant" && c.id === msgId
                  ? { ...c, isStreaming: false, text: c.streamedText }
                  : c
              ));
              // Read aloud a short excerpt
              setChat(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") playVoice(last.streamedText?.slice(0, 300) || "");
                return prev;
              });
              // Save consultation and log activity
              try {
                setChat(prev => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant") {
                    ConsultationService.save({ type: 'chat', query: message, response: { text: last.streamedText || last.text || '' } });
                    ActivityLogService.log('chat_response', `AI response for: ${message}`, 'chat');
                  }
                  return prev;
                });
              } catch {}
            }
            setStreaming(false);
            abortRef.current = null;
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setChat(prev => [...prev, { role: "error", text: "Connection error. Please try again.", time: getTime() }]);
      }
      setStreaming(false);
      setLoading(false);
      abortRef.current = null;
    }
  }, [msg, loading, streaming, chat]);

  // ─── IMAGE SCAN ─────────────────────────────────────────
  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setChat(prev => [...prev, { role: "user-image", image: preview, time: getTime() }]);
    const formData = new FormData();
    formData.append("image", file);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/analyze-image`, { method: "POST", body: formData });
      const data = await res.json();
      const med  = data.data || data;
      const similar = await fetchSimilar(med.name);
      setChat(prev => [...prev, { role: "ai", data: med, similar, time: getTime() }]);
      const usesText = Array.isArray(med.uses) ? med.uses.join(", ") : med.uses;
      setTimeout(() => playVoice(`${med.name}. Uses: ${usesText}`), 300);
      // Save consultation and log activity
      try {
        ConsultationService.save({ type: 'chat', query: 'Image scan', response: med, diagnosis: med.name });
        ActivityLogService.log('chat_image_scan', `Scanned medicine: ${med.name}`, 'chat');
      } catch {}
    } catch {
      setChat(prev => [...prev, { role: "error", text: "Image scan failed.", time: getTime() }]);
    } finally {
      setLoading(false);
      URL.revokeObjectURL(preview);
    }
  };

  // ─── RENDER ─────────────────────────────────────────────
  const isDisabled = loading || streaming;

  return (
    <div className="cb-root">
      <div className="cb-bg-orb cb-orb1" />
      <div className="cb-bg-orb cb-orb2" />

      {/* HEADER */}
      <header className="cb-header">
        <div className="cb-header-left">
          <div className="cb-logo">⚕</div>
          <div>
            <h1 className="cb-title">MedAI Chat</h1>
            <p className="cb-subtitle">Smart medicine assistant</p>
          </div>
        </div>
        <div className="cb-header-right">
          {speaking && (
            <div className="cb-speaking-badge" onClick={stopSpeaking} title="Click to stop">
              <span className="cb-wave" /><span className="cb-wave" /><span className="cb-wave" />
              Speaking…
            </div>
          )}
          {streaming && (
            <div className="cb-streaming-badge">
              <span className="cb-dot" />Generating…
            </div>
          )}
        </div>
      </header>

      {/* MESSAGES */}
      <div className="cb-body">
        {chat.length === 0 && (
          <div className="cb-empty">
            <div className="cb-empty-icon">💊</div>
            <p className="cb-empty-title">Ask about any medicine or health topic</p>
            <p className="cb-empty-sub">Type a question, use voice, or scan a label</p>
            <div className="cb-suggestions">
              {["What is Paracetamol?", "How does ibuprofen work?", "What causes fever?", "Paracetamol vs Ibuprofen"].map(s => (
                <button key={s} className="cb-suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {chat.map((c, i) => (
          <div key={i} className={`cb-row cb-row--${c.role}`}>

            {c.role === "user" && (
              <div className="cb-bubble cb-bubble--user">
                <p>{c.text}</p>
                <span className="cb-time">{c.time}</span>
              </div>
            )}

            {c.role === "user-image" && (
              <div className="cb-bubble cb-bubble--user cb-bubble--img">
                <img src={c.image} alt="Scanned medicine label" className="cb-img-preview" />
                <span className="cb-time">{c.time}</span>
              </div>
            )}

            {/* ── Real-time streaming assistant bubble ── */}
            {c.role === "assistant" && (
              <div className="cb-ai-card cb-ai-card--chat">
                <div className="cb-ai-avatar">🤖</div>
                <div className="cb-ai-chat-body">
                  <StreamingText text={c.streamedText || c.text || ""} isStreaming={c.isStreaming} />
                  <span className="cb-time">{c.time}</span>
                </div>
              </div>
            )}

            {/* ── Structured medicine card ── */}
            {c.role === "ai" && (
              <div className="cb-ai-card">
                <div className="cb-ai-header">
                  <span className="cb-ai-name">💊 {c.data?.name}</span>
                  <span className="cb-time">{c.time}</span>
                </div>
                <div className="cb-ai-grid">
                  <MedBlock icon="🩺" title="Uses"         data={c.data?.uses} />
                  <MedBlock icon="💊" title="Dosage"       data={c.data?.dosage} />
                  <MedBlock icon="⚠️" title="Side Effects" data={c.data?.side_effects} warn />
                  <MedBlock icon="🚨" title="Warnings"     data={c.data?.warnings} danger />
                </div>
                {c.similar && c.similar.length > 0 && (
                  <SimilarMedicines items={c.similar} onSelect={(name) => sendMessage(name)} />
                )}
                <p className="cb-ai-disclaimer">AI-generated. Not a substitute for professional advice.</p>
              </div>
            )}

            {c.role === "bot" && (
              <div className="cb-ai-card cb-ai-card--simple">
                <p>{c.text}</p>
                <span className="cb-time">{c.time}</span>
              </div>
            )}

            {c.role === "error" && (
              <div className="cb-error-msg">⚠ {c.text}</div>
            )}
          </div>
        ))}

        {loading && (
          <div className="cb-row cb-row--ai">
            <div className="cb-typing"><span /><span /><span /></div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* INPUT BAR */}
      <div className="cb-input-bar">
        <div className="cb-input-wrap">
          <textarea
            ref={textareaRef}
            className="cb-input cb-input--ta"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about a medicine or health topic… (Shift+Enter for newline)"
            disabled={isDisabled}
            rows={1}
          />

          {streaming ? (
            <button className="cb-btn cb-btn--stop-stream" onClick={stopStream} title="Stop generating">
              <StopIcon />
            </button>
          ) : (
            <button
              className="cb-btn cb-btn--send"
              onClick={() => sendMessage()}
              disabled={isDisabled || !msg.trim()}
              title="Send"
            >
              <SendIcon />
            </button>
          )}
        </div>

        <div className="cb-toolbar">
          <button
            className={`cb-tool-btn ${listening ? "cb-tool-btn--active" : ""}`}
            onClick={startVoice}
            disabled={isDisabled}
            title={listening ? "Listening…" : "Voice input"}
          >
            <MicIcon />
            <span className="cb-tool-label">{listening ? "Listening…" : "Voice"}</span>
          </button>

          <button
            className={`cb-tool-btn ${voiceOn ? "cb-tool-btn--on" : "cb-tool-btn--off"}`}
            onClick={() => setVoiceOn(v => !v)}
            title={voiceOn ? "Voice ON" : "Voice OFF"}
          >
            {voiceOn ? <SpeakerIcon /> : <MuteIcon />}
            <span className="cb-tool-label">{voiceOn ? "Sound On" : "Muted"}</span>
          </button>

          <button
            className="cb-tool-btn"
            onClick={stopSpeaking}
            disabled={!speaking}
            title="Stop speaking"
          >
            <StopIcon /><span className="cb-tool-label">Stop</span>
          </button>

          <label className="cb-tool-btn" title="Scan medicine label">
            <CameraIcon /><span className="cb-tool-label">Scan</span>
            <input type="file" accept="image/*" hidden onChange={handleImage} />
          </label>

          {chat.length > 0 && (
            <button
              className="cb-tool-btn cb-tool-btn--clear"
              onClick={() => { stopStream(); stopSpeaking(); setChat([]); }}
              title="Clear chat"
            >
              <TrashIcon /><span className="cb-tool-label">Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── STREAMING TEXT — renders text with a blinking cursor ──
function StreamingText({ text, isStreaming }) {
  return (
    <div className="cb-stream-text">
      {text}
      {isStreaming && <span className="cb-cursor" />}
    </div>
  );
}

// ─── SIMILAR MEDICINES ───────────────────────────────────
function SimilarMedicines({ items, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="cb-similar">
      <div className="cb-similar-header" onClick={() => setExpanded(e => !e)}>
        <span className="cb-similar-title">🔄 Similar Medicines</span>
        <span className="cb-similar-count">{items.length} found</span>
        <span className="cb-similar-toggle">{expanded ? "▲" : "▼"}</span>
      </div>
      <div className="cb-similar-chips">
        {items.map((item, i) => (
          <button key={i} className="cb-similar-chip" onClick={() => onSelect(item.name)} title={`Ask about ${item.name}`}>
            💊 {item.name}
          </button>
        ))}
      </div>
      {expanded && (
        <div className="cb-similar-cards">
          {items.map((item, i) => (
            <div key={i} className="cb-similar-card">
              <div className="cb-similar-card-name">
                <span>💊 {item.name}</span>
                <button className="cb-similar-card-btn" onClick={() => onSelect(item.name)}>View info →</button>
              </div>
              {item.reason        && <p className="cb-similar-card-reason"><span className="cb-similar-label">Why similar:</span> {item.reason}</p>}
              {item.key_difference && <p className="cb-similar-card-diff"><span className="cb-similar-label">Key difference:</span> {item.key_difference}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MED BLOCK ──────────────────────────────────────────
function MedBlock({ icon, title, data, warn, danger }) {
  if (!data) return null;
  const cls = danger ? "cb-med-block--danger" : warn ? "cb-med-block--warn" : "";
  return (
    <div className={`cb-med-block ${cls}`}>
      <div className="cb-med-block-title">{icon} {title}</div>
      {Array.isArray(data)
        ? data.map((d, i) => <p key={i} className="cb-med-block-item">• {d}</p>)
        : <p className="cb-med-block-item">{data}</p>}
    </div>
  );
}

// ─── ICONS ──────────────────────────────────────────────
const SendIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
const MicIcon     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
const SpeakerIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
const MuteIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>;
const StopIcon    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>;
const CameraIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>;
const TrashIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;

export default Chatbot;