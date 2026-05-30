# MediCheck v2 — AI Medicine Identifier

> Identify any medicine instantly. Dosage timing, side effects, interactions, alternatives — powered by Claude AI.

---

## Quick Start

### 1. Setup

```bash
cd backend
npm install
cp .env.example .env
```

### 2. Add your API key

Open `backend/.env` and set:
```
ANTHROPIC_API_KEY=your_key_here
```
Get a key at https://console.anthropic.com

### 3. Run

```bash
npm start
```

Open **http://localhost:5000** — the backend serves the frontend automatically.

---

## Features

| Feature | Description |
|---|---|
| 🔤 By Name | Type any medicine name or description |
| 📷 By Photo | Upload a photo of the pill or packaging |
| ▦ By Barcode | Enter the barcode/NDC number from the label |
| ⏰ Timing | Before/after food, morning/night, frequency |
| 💉 Dosage | Standard dose, per-dose instructions, max daily |
| ⚠️ Side Effects | 4 common + 1 critical effect to watch |
| 🚫 Precautions | Foods/substances to avoid |
| 🔗 Interactions | Drug-drug interactions with severity levels |
| 🔄 Alternatives | Generic and alternative medicines |
| 📋 History | Local history of past searches |

---

## API Endpoints

```
POST /api/medicine/text       — Identify by name/description
POST /api/medicine/image      — Identify by photo (multipart/form-data, field: "image")
POST /api/medicine/barcode    — Identify by barcode
GET  /api/medicine/suggestions — Get quick suggestion list
GET  /api/health              — Health check
```

---

## Project Structure

```
medicheck-v2/
├── frontend/
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js
└── backend/
    ├── server.js
    ├── package.json
    ├── .env.example
    ├── controllers/
    │   └── medicineController.js
    ├── routes/
    │   └── medicine.js
    └── middleware/
        └── errorHandler.js
```

---

## Disclaimer

MediCheck provides general medication information only. Always follow your doctor's or pharmacist's specific instructions. Not a substitute for professional medical advice.
