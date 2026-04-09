# AI Cyber War Room

AI-powered cyber attack simulation and defence platform.

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- Anthropic API key

### Setup
1. Clone this repo
2. Add your Anthropic API key to .env:
   ANTHROPIC_API_KEY=your_key_here

### Run
Terminal 1 (Backend):
  ```bash
  cd backend
  pip install -r requirements.txt
  python main.py
  ```

Terminal 2 (Frontend):
  ```bash
  cd frontend
  npm install
  npm start
  ```

Open http://localhost:3000
Login: admin / cyberwar123

## Features
- Live attack simulation (SQL injection + brute force)
- Real-time threat detection with AI explanations (Claude API)
- WebSocket live feed — attacks stream every 3 seconds
- ARIA virtual assistant — ask anything about live threats
- SQLite database — all events persisted
- JWT authentication
- Dark cyber UI

## Architecture
Frontend (React:3000) ←HTTP/WS→ Backend (FastAPI:8000) ←SQLite→ war_room.db
Backend ←Anthropic API→ Claude (explanations + ARIA chat)
