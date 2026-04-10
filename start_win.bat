@echo off
echo Starting AI Cyber War Room...

cd backend
start cmd /k "python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

cd ../frontend
start cmd /k "npm start"

echo System initialized. Open http://localhost:3000
