# WarRoomX — AI Cyber Threat Intelligence Platform

> AAA-standard tactical AI defense system. Real-time attack simulation, autonomous threat detection, and ARIA AI analyst — built for the hackathon.

---

## 🚀 One-Command Install (Recommended)

### Prerequisites
Install these once:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — works on Windows, Mac, Linux

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/hamsabm/Binary-Brains.git
cd Binary-Brains

# 2. Add your Anthropic API key
cp backend/.env.example backend/.env
# Open backend/.env and replace: ANTHROPIC_API_KEY=your_anthropic_api_key_here

# 3. Launch everything
docker-compose up --build
```

Open your browser: **http://localhost:3000**

Login: `admin` / `cyberwar123`

---

## 🎮 Features

- ⚔️ **Dual-Agent Engine** — Offensive + Defensive simulation engines
- 🛡️ **Shield Integrity System** — Live HP bar with damage flash and DEFCON levels
- 🤖 **ARIA AI Analyst** — Powered by Claude `claude-opus-4-5`, real SOC-grade chat
- 🌐 **3D Globe Engine** — Live attack arc visualization with `react-globe.gl`
- ⚡ **WebSocket Live Feed** — New threat every 3 seconds
- 🎯 **XP & Commander Rank** — Gamified defense progression
- 📊 **Neural War Room** — Unified strategic ledger

---

## 🛠️ Manual Install (Without Docker)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Add your ANTHROPIC_API_KEY
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## 🔑 API Key Setup

Get your free Anthropic API key at: https://console.anthropic.com
Paste it in `backend/.env` as: `ANTHROPIC_API_KEY=sk-ant-...`

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, Python 3.11, WebSockets |
| AI Engine | Claude claude-opus-4-5 via Anthropic SDK |
| Frontend | React, Tailwind CSS, react-globe.gl |
| Auth | JWT + bcrypt |
| Database | SQLite |
| Deploy | Docker + docker-compose |

---

## 👥 Team

**Team Hamsa** — Binary Brains Hackathon 2024
GitHub: https://github.com/hamsabm/Binary-Brains

---

## ⚡ Troubleshooting

**Port already in use?**
```bash
docker-compose down
docker-compose up --build
```

**Backend not connecting?**
Make sure `backend/.env` has a valid `ANTHROPIC_API_KEY`

**Docker not installed?**
Download from https://www.docker.com/products/docker-desktop/
