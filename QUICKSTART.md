#!/bin/bash
# Quick Start Script for Medical AI System

echo "🏥 Medical AI System - Quick Start"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Backend
echo -e "${BLUE}Step 1: Starting Backend...${NC}"
echo "📍 Location: Medical-AI/backend"
echo "📝 Commands:"
echo "   cd Medical-AI/backend"
echo "   pip install -r requirements.txt"
echo "   python app.py"
echo ""
echo "✅ Backend will run on: http://localhost:5001"
echo ""

# Step 2: Frontend
echo -e "${BLUE}Step 2: Starting Frontend...${NC}"
echo "📍 Location: Medical-AI/react-frontend"
echo "📝 Commands:"
echo "   cd Medical-AI/react-frontend"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "✅ Frontend will run on: http://localhost:5173"
echo ""

# Step 3: Access
echo -e "${BLUE}Step 3: Access Dashboard${NC}"
echo "🌐 Open browser: http://localhost:5173"
echo ""

# Step 4: Verify
echo -e "${BLUE}Step 4: Verify System${NC}"
echo "📋 Check if working:"
echo "   - Backend running on :5001"
echo "   - Frontend running on :5173"
echo "   - PostgreSQL running on :5432"
echo "   - Database: meddb exists"
echo "   - Components showing data"
echo ""

# Step 5: Test API
echo -e "${BLUE}Step 5: Test API (Optional)${NC}"
echo "🧪 Test endpoints:"
echo ""
echo "   # Get all consultations"
echo "   curl http://localhost:5001/api/consultations"
echo ""
echo "   # Save consultation"
echo "   curl -X POST http://localhost:5001/api/consultations \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"query\":\"Test\",\"type\":\"chat\"}'"
echo ""
echo "   # Get analytics"
echo "   curl http://localhost:5001/api/analytics"
echo ""

echo -e "${GREEN}=================================="
echo "✨ System Setup Complete!"
echo "==================================${NC}"
echo ""
echo "📚 For detailed documentation, see:"
echo "   - DATABASE_SETUP.md"
echo "   - SYSTEM_COMPLETE.md"
