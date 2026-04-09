#!/bin/bash
echo "=== Starting AI Cyber War Room ==="
echo "Step 1: Backend"
cd backend && pip install -r requirements.txt -q && cd ..
echo "Backend deps installed."
echo "Step 2: Frontend"
cd frontend && npm install --silent && cd ..
echo "Frontend deps installed."
echo "Step 3: Launch"
echo "Open TWO terminals:"
echo "  Terminal 1: bash start_backend.sh"
echo "  Terminal 2: bash start_frontend.sh"
echo "Then open: http://localhost:3000"
echo "Login: admin / cyberwar123"
