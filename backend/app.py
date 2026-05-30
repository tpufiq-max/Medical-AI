from flask import Flask, request, jsonify, Response, stream_with_context
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from dotenv import load_dotenv
from groq import Groq
from typing import Optional
from PIL import Image
from datetime import datetime
import pytesseract
import os, json, re

# ================= INIT =================
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ================= CONFIG =================
app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"postgresql://postgres:{os.getenv('DB_PASSWORD', 'Toufiq%40786')}@localhost:5432/meddb"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ================= MODELS =================
class Medicine(db.Model):
    __tablename__ = 'medicine'
    __table_args__ = {'schema': 'public'}

    id           = db.Column(db.Integer, primary_key=True)
    name         = db.Column(db.String(100))
    uses         = db.Column(db.Text)
    dosage       = db.Column(db.Text)
    side_effects = db.Column(db.Text)


class Interaction(db.Model):
    __tablename__ = 'interaction'
    __table_args__ = {'schema': 'public'}

    id          = db.Column(db.Integer, primary_key=True)
    drug1       = db.Column(db.String(100))
    drug2       = db.Column(db.String(100))
    severity    = db.Column(db.String(50))
    description = db.Column(db.Text)


# ================= TESSERACT =================
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ================= GROQ AI =================
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    print("Warning: GROQ_API_KEY not found in .env — AI features will be disabled.")
    client = None
else:
    client = Groq(api_key=api_key)

FALLBACK = {
    "name": "Unknown",
    "uses": ["Information unavailable"],
    "dosage": "Consult a doctor",
    "side_effects": ["Information unavailable"],
    "warnings": ["Always consult a healthcare professional"],
}

def medicine_prompt(name: str) -> str:
    return f"""Return ONLY a JSON object for the medicine "{name}":
{{
  "name": "{name}",
  "uses": ["use1", "use2"],
  "dosage": "dosage info",
  "side_effects": ["effect1", "effect2"],
  "warnings": ["warning1", "warning2"]
}}"""

def ask_groq(prompt: str) -> Optional[dict]:
    if client is None:
        print("ask_groq: GROQ client unavailable — returning None")
        return None
    raw = ""
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a medical information assistant. "
                        "Always respond with ONLY valid JSON, no markdown, no explanation."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=800,
        )
        raw = response.choices[0].message.content.strip()
        clean = re.sub(r"^```(?:json)?|```$", "", raw, flags=re.MULTILINE).strip()
        return json.loads(clean)
    except json.JSONDecodeError as e:
        print("JSON PARSE ERROR:", e, "| raw:", raw[:200])
        return None
    except Exception as e:
        print("GROQ ERROR:", e)
        return None

# ================= STATS =================
stats = {"searches": 0, "interactions": 0, "chats": 0, "scans": 0, "streams": 0}
recent_activity: list[str] = []
history: list[dict] = []

def add_activity(text: str):
    timestamp = datetime.now().strftime("%H:%M")
    recent_activity.insert(0, f"[{timestamp}] {text}")
    if len(recent_activity) > 20:
        recent_activity.pop()

def add_history(event_type: str):
    history.append({"type": event_type, **stats})
    if len(history) > 30:
        history.pop(0)

# ================= UTIL =================
def extract_medicine_name(text: str) -> str:
    for line in text.split("\n"):
        line = line.strip()
        if len(line) > 2 and sum(c.isalpha() for c in line) > len(line) * 0.5:
            return line
    words = text.split()
    return words[0].strip() if words else "Unknown"

# Words that strongly indicate the user wants a conversational answer,
# NOT a structured medicine card — these always go to the stream.
GENERAL_HEALTH_KEYWORDS = [
    "cause", "causes", "caused by", "reason", "reasons",
    "what is", "what are", "how does", "how do", "how is",
    "explain", "describe", "tell me about",
    "symptom", "symptoms", "sign", "signs",
    "treatment", "treatments", "cure", "cures", "therapy",
    "prevent", "prevention", "avoid",
    "difference between", "vs", "versus", "compare",
    "why", "when", "who", "which",
    "virus", "bacteria", "disease", "disorder", "condition", "syndrome",
    "cancer", "infection", "fever", "pain", "diet", "nutrition",
    "mental health", "anxiety", "depression", "diabetes", "hypertension",
]

# Words that only appear in medicine/drug names or medicine-specific queries
MEDICINE_SPECIFIC_KEYWORDS = [
    "mg", "mcg", "tablet", "tablets", "capsule", "capsules",
    "syrup", "injection", "dosage", "dose", "overdose",
    "side effect", "side effects", "contraindication",
    "generic", "brand name", "prescription",
    "antibiotic", "antifungal", "antiviral", "analgesic",
    "painkiller", "ibuprofen", "paracetamol", "aspirin",
    "amoxicillin", "metformin", "atorvastatin",
]

def is_medicine_query(msg: str) -> bool:
    """
    Return True ONLY when the message is specifically asking for a
    structured medicine profile (name, uses, dosage, side-effects).
    Return False for all general health / disease / science questions.
    """
    lower = msg.lower().strip()
    words = lower.split()

    # 1. If it contains any general-health signal → conversational stream
    if any(kw in lower for kw in GENERAL_HEALTH_KEYWORDS):
        return False

    # 2. If it contains medicine-specific jargon → medicine card
    if any(kw in lower for kw in MEDICINE_SPECIFIC_KEYWORDS):
        return True

    # 3. Explicit medicine-info phrases
    medicine_phrases = [
        "info on", "information about", "uses of", "dosage of",
        "dose of", "drug",
    ]
    if any(ph in lower for ph in medicine_phrases):
        return True

    # 4. Very short query (1-2 words, no question words) → likely a drug name
    #    e.g. "paracetamol", "metformin 500"
    question_starters = {"what", "why", "how", "when", "where", "who", "which", "is", "are", "does", "do", "can", "could", "should", "would"}
    if 1 <= len(words) <= 2 and words[0] not in question_starters:
        return True

    # 5. Everything else → conversational
    return False

# ================= ROUTES =================

@app.route("/")
def home():
    return jsonify({
        "status": "ok",
        "message": "MedAI API is running",
        "endpoints": ["/search", "/chat", "/stream", "/interaction", "/analyze-image", "/voice", "/stats", "/similar"],
    }), 200


@app.route("/search", methods=["GET", "POST"])
def search():
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        name = (data.get("name") or "").strip()
    else:
        name = (request.args.get("name") or "").strip()

    if not name:
        return jsonify({"error": "Medicine name is required"}), 400

    stats["searches"] += 1
    add_activity(f"Search: {name}")
    add_history("search")

    meds = Medicine.query.filter(Medicine.name.ilike(f"%{name}%")).all()
    if meds:
        return jsonify([
            {"name": m.name, "uses": m.uses, "dosage": m.dosage, "side_effects": m.side_effects}
            for m in meds
        ]), 200

    result = ask_groq(medicine_prompt(name)) or {**FALLBACK, "name": name}
    return jsonify(result), 200


@app.route("/interaction", methods=["GET", "POST"])
def interaction():
    if request.method == "POST":
        data  = request.get_json(silent=True) or {}
        drug1 = (data.get("drug1") or "").strip()
        drug2 = (data.get("drug2") or "").strip()
    else:
        drug1 = (request.args.get("drug1") or "").strip()
        drug2 = (request.args.get("drug2") or "").strip()

    if not drug1 or not drug2:
        return jsonify({"error": "Both drug names are required"}), 400

    stats["interactions"] += 1
    add_activity(f"Interaction: {drug1} + {drug2}")
    add_history("interaction")

    inter = Interaction.query.filter(
        ((Interaction.drug1.ilike(drug1)) & (Interaction.drug2.ilike(drug2))) |
        ((Interaction.drug1.ilike(drug2)) & (Interaction.drug2.ilike(drug1)))
    ).first()

    if inter:
        return jsonify({
            "source": "db",
            "interaction": "Yes",
            "severity": inter.severity,
            "clinical_effect": inter.description,
            "mechanism": "See description",
            "advice": "Consult your doctor before combining these medicines.",
            "monitoring": "Monitor for unusual symptoms.",
        }), 200

    prompt = f"""Return ONLY a JSON object for the drug interaction between "{drug1}" and "{drug2}":
{{
  "interaction": "Yes or No",
  "severity": "None / Low / Moderate / High",
  "clinical_effect": "what happens when taken together",
  "mechanism": "why this interaction occurs",
  "advice": "what the patient should do",
  "monitoring": "what to watch for"
}}"""
    result = ask_groq(prompt) or {
        "interaction": "Unknown",
        "severity": "Unknown",
        "clinical_effect": "Unable to determine. Please consult a pharmacist.",
        "mechanism": "Unavailable",
        "advice": "Do not combine without professional advice.",
        "monitoring": "Monitor for unusual symptoms.",
    }
    return jsonify(result), 200


@app.route("/chat", methods=["POST"])
def chat():
    """Legacy non-streaming endpoint — kept for compatibility."""
    data = request.get_json(silent=True) or {}
    msg  = (data.get("message") or "").strip()

    if not msg:
        return jsonify({"error": "Message cannot be empty"}), 400

    stats["chats"] += 1
    add_activity(f"Chat: {msg}")
    add_history("chat")

    med = Medicine.query.filter(Medicine.name.ilike(f"%{msg}%")).first()
    if med:
        return jsonify({
            "type": "db",
            "data": {"name": med.name, "uses": med.uses, "dosage": med.dosage, "side_effects": med.side_effects},
        }), 200

    prompt = f"""You are a helpful medical assistant. The user says: "{msg}"
If asking about a medicine, return ONLY:
{{"name":"...","uses":["..."],"dosage":"...","side_effects":["..."],"warnings":["..."]}}
If a general question, return ONLY:
{{"answer":"your helpful answer"}}"""
    result = ask_groq(prompt) or {**FALLBACK, "name": msg}
    return jsonify({"type": "ai", "data": result}), 200


# ═══════════════════════════════════════════════════════════
#  STREAMING CHAT  —  Server-Sent Events
#
#  POST /stream
#  Body: { "message": "...", "history": [{role, content}, ...] }
#
#  SSE event types:
#    { "type": "token",    "content": "..." }   → append to bubble
#    { "type": "medicine", "data":   {...}  }   → render medicine card
#    { "type": "done"                       }   → stream finished
# ═══════════════════════════════════════════════════════════
@app.route("/stream", methods=["POST"])
def stream_chat():
    data       = request.get_json(silent=True) or {}
    msg        = (data.get("message") or "").strip()
    conv_hist  = data.get("history", [])   # [{role, content}, ...]

    if not msg:
        return jsonify({"error": "Message cannot be empty"}), 400

    stats["streams"] += 1
    add_activity(f"Stream: {msg}")

    def generate():
        # ── 1. DB medicine match → instant card ──
        med = Medicine.query.filter(Medicine.name.ilike(f"%{msg}%")).first()
        if med:
            payload = {
                "type": "medicine",
                "data": {
                    "name": med.name,
                    "uses": med.uses,
                    "dosage": med.dosage,
                    "side_effects": med.side_effects,
                    "warnings": [],
                },
            }
            yield f"data: {json.dumps(payload)}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        # ── 2. Short / medicine-keyword query → AI card ──
        if is_medicine_query(msg):
            result = ask_groq(medicine_prompt(msg))
            if result and result.get("name", "").lower() not in ("unknown", ""):
                yield f"data: {json.dumps({'type': 'medicine', 'data': result})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return

        # ── 3. General conversation → streaming tokens ──
        system_prompt = (
            "You are MedAI, a knowledgeable and friendly medical assistant. "
            "You answer ALL health, medicine, and science questions — including diseases, "
            "viruses, conditions, symptoms, causes, treatments, and general biology. "
            "Never say you cannot answer a health question. "
            "Always give a clear, informative response. "
            "Use plain readable text only — no markdown symbols like **, ##, or ---. "
            "Use numbered lists (1. 2. 3.) when listing multiple items. "
            "Structure longer answers with clear sections in plain text (e.g. 'Causes:', 'Symptoms:', 'Treatment:'). "
            "End with a brief reminder to consult a doctor for personal medical advice. "
            "Keep answers thorough but focused."
        )

        messages = [{"role": "system", "content": system_prompt}]
        for h in conv_hist[-10:]:
            if h.get("role") in ("user", "assistant") and h.get("content"):
                messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": msg})

        if client is None:
            err = "AI streaming disabled (GROQ_API_KEY missing). Try non-stream endpoint."
            yield f"data: {json.dumps({'type': 'token', 'content': err})}\n\n"
        else:
            try:
                stream = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=messages,
                    temperature=0.6,
                    max_tokens=1024,
                    stream=True,
                )
                for chunk in stream:
                    delta = chunk.choices[0].delta
                    if delta and delta.content:
                        yield f"data: {json.dumps({'type': 'token', 'content': delta.content})}\n\n"

            except Exception as e:
                print("STREAM ERROR:", e)
                err = "Sorry, I ran into an error. Please try again."
                yield f"data: {json.dumps({'type': 'token', 'content': err})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection":       "keep-alive",
        },
    )


# ================= SIMILAR MEDICINES =================
@app.route("/similar", methods=["GET", "POST"])
def similar():
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        name = (data.get("name") or "").strip()
    else:
        name = (request.args.get("name") or "").strip()

    if not name:
        return jsonify({"error": "Medicine name is required"}), 400

    source_med  = Medicine.query.filter(Medicine.name.ilike(f"%{name}%")).first()
    db_similars = []

    if source_med and source_med.uses:
        use_keywords = [w.strip() for w in re.split(r"[,.\n]", source_med.uses) if len(w.strip()) > 3]
        keyword = use_keywords[0] if use_keywords else ""
        if keyword:
            candidates = Medicine.query.filter(
                Medicine.uses.ilike(f"%{keyword}%"),
                Medicine.name.notilike(f"%{name}%")
            ).limit(5).all()
            db_similars = [
                {"name": m.name, "reason": f"Similar use: {keyword}", "key_difference": "See full profile"}
                for m in candidates
            ]

    if db_similars:
        return jsonify({"source": "db", "similar": db_similars}), 200

    prompt = f"""Return ONLY a JSON object listing medicines similar to "{name}" (same active ingredient class or same therapeutic use):
{{
  "similar": [
    {{
      "name": "medicine name",
      "reason": "why it is similar",
      "key_difference": "one key difference from {name}"
    }}
  ]
}}
Return 4 to 6 similar medicines. No markdown, no explanation."""

    result = ask_groq(prompt)
    if result and "similar" in result:
        return jsonify({"source": "ai", "similar": result["similar"]}), 200
    return jsonify({"source": "ai", "similar": []}), 200


@app.route("/analyze-image", methods=["POST"])
def analyze_image():
    file = request.files.get("image")
    if not file:
        return jsonify({"error": "No image provided"}), 400
    try:
        img  = Image.open(file)
        text = pytesseract.image_to_string(img).strip()
        if not text:
            return jsonify({"error": "No text found in image"}), 400
        name = extract_medicine_name(text)
        stats["scans"] += 1
        add_activity(f"Scanned: {name}")
        add_history("scan")
        result = ask_groq(medicine_prompt(name)) or {**FALLBACK, "name": name}
        return jsonify(result), 200
    except Exception as e:
        print("IMAGE ERROR:", e)
        return jsonify({"error": "Image processing failed."}), 500


@app.route("/voice", methods=["GET"])
def voice():
    try:
        import speech_recognition as sr
    except ImportError:
        return jsonify({"error": "Run: pip install SpeechRecognition"}), 500
    recognizer = sr.Recognizer()
    try:
        with sr.Microphone() as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio = recognizer.listen(source, timeout=6, phrase_time_limit=8)
        text = recognizer.recognize_google(audio)
        return jsonify({"text": text}), 200
    except sr.WaitTimeoutError:
        return jsonify({"error": "Listening timed out."}), 408
    except sr.UnknownValueError:
        return jsonify({"error": "Could not understand audio."}), 422
    except sr.RequestError:
        return jsonify({"error": "Speech service unavailable."}), 503
    except Exception:
        return jsonify({"error": "Voice recognition failed."}), 500


@app.route("/stats", methods=["GET"])
def get_stats():
    return jsonify({"stats": stats, "recent": recent_activity, "history": history}), 200


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed"}), 405

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    # threaded=True is required for SSE streaming to work correctly
    app.run(host="0.0.0.0", port=5001, debug=True, threaded=True)