# Medical AI - Database Setup Guide

## ✅ What's Been Updated

### Backend (Flask - Python)
- **New Database Models**:
  - `Consultation` - Stores chat consultations, diagnoses, recommendations
  - `MedicalRecord` - Stores medical reports, tests, scans
  - `ActivityLog` - Stores user activities for history tracking

- **New API Endpoints**:
  - `POST /api/consultations` - Save consultation
  - `GET /api/consultations` - Get all consultations
  - `GET /api/consultations/<id>` - Get specific consultation
  - `POST /api/records` - Save medical record
  - `GET /api/records` - Get all records (with type filtering)
  - `DELETE /api/records/<id>` - Delete record
  - `POST /api/activity` - Log activity
  - `GET /api/activity` - Get activity logs
  - `GET /api/analytics` - Get analytics summary

### Frontend (React)
- **Updated Data Services**:
  - `ConsultationService` - Now uses API calls
  - `MedicalRecordService` - Now uses API calls
  - `ActivityLogService` - Now uses API calls
  - `AnalyticsService` - Now uses API calls

- **Updated Components**:
  - All components now handle async API operations
  - Proper error handling and loading states
  - Real-time data polling from database

## 🚀 Running the Application

### 1. Start the Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on: `http://localhost:5001`

### 2. Start the Frontend
```bash
cd react-frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173` (or shown in terminal)

## 📊 Testing the Integration

### View Data in Database

1. **Connect to PostgreSQL**:
   ```bash
   psql -U postgres -d meddb -h localhost
   ```

2. **View Tables**:
   ```sql
   -- Check consultations
   SELECT * FROM public.consultations ORDER BY created_at DESC;

   -- Check medical records
   SELECT * FROM public.medical_records ORDER BY created_at DESC;

   -- Check activity logs
   SELECT * FROM public.activity_logs ORDER BY created_at DESC;
   ```

### Test API Endpoints

1. **Save a Consultation**:
   ```bash
   curl -X POST http://localhost:5001/api/consultations \
     -H "Content-Type: application/json" \
     -d '{
       "type": "chat",
       "query": "What is diabetes?",
       "diagnosis": "Type 2 Diabetes",
       "recommendations": ["Reduce sugar intake", "Exercise regularly"]
     }'
   ```

2. **Get All Consultations**:
   ```bash
   curl http://localhost:5001/api/consultations
   ```

3. **Save a Medical Record**:
   ```bash
   curl -X POST http://localhost:5001/api/records \
     -H "Content-Type: application/json" \
     -d '{
       "type": "report",
       "title": "Blood Test Results",
       "content": "Glucose level: 120 mg/dL",
       "tags": ["blood-test", "urgent"]
     }'
   ```

4. **Get Analytics**:
   ```bash
   curl http://localhost:5001/api/analytics
   ```

## 🎯 UI Components & Real-Time Data

### Consultations Page
- Shows total consultations from database
- Displays breakdown by type
- Lists recent consultations with queries, diagnoses, and recommendations
- Auto-refreshes every 5 seconds

### History Page
- Shows activity timeline organized by date
- Each activity includes action, details, and category
- Real-time updates from database

### Reports Page
- Lists medical records with filtering by type
- Dual-panel layout for browsing and viewing details
- Click to select and view full record content
- Shows tags and metadata

### Analytics Page
- Total consultations counter
- Monthly trend bar chart (interactive)
- Consultation type distribution with percentages
- Click monthly bars to see details

## 🔄 Data Flow

```
React Components
      ↓
dataService.js (async API calls)
      ↓
Fetch API (HTTP requests)
      ↓
Flask Backend (/api/*)
      ↓
SQLAlchemy ORM
      ↓
PostgreSQL Database (consultations, medical_records, activity_logs)
```

## 💾 Database Schema

### consultations
- `id` (primary key)
- `created_at` (timestamp)
- `consultation_type` (string)
- `query` (text)
- `response` (text)
- `diagnosis` (text)
- `symptoms` (JSON array)
- `recommendations` (JSON array)
- `metadata` (JSON)

### medical_records
- `id` (primary key)
- `created_at` (timestamp)
- `record_type` (string)
- `title` (string)
- `content` (text)
- `tags` (JSON array)
- `metadata` (JSON)

### activity_logs
- `id` (primary key)
- `created_at` (timestamp)
- `action` (string)
- `details` (text)
- `category` (string)
- `metadata` (JSON)

## ⚠️ Important Notes

1. **API Base URL**: Frontend expects backend at `http://localhost:5001`
2. **CORS**: Already enabled for all origins
3. **Database**: Make sure PostgreSQL is running with `meddb` database
4. **Real-Time**: Data updates every 5 seconds automatically
5. **Error Handling**: Check browser console for API errors

## 🔧 Troubleshooting

**Backend won't start?**
- Make sure PostgreSQL is running
- Check `.env` file has correct DB_PASSWORD
- Run: `pip install -r requirements.txt`

**Frontend can't fetch data?**
- Make sure backend is running on port 5001
- Check browser console for CORS errors
- Verify API endpoints in `dataService.js`

**Data not showing in UI?**
- Check Network tab in browser DevTools
- Verify database has actual data
- Check API responses in Network tab

## 📝 Next Steps

1. ✅ Backend is running and storing data
2. ✅ Frontend shows real data from database
3. ✅ UI is professional with animations
4. 🎯 Integrate with chatbot to auto-save consultations
5. 🎯 Integrate with OCR to auto-save scanned documents
