import os
from dotenv import load_dotenv; load_dotenv()
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
from datetime import datetime

# Local Imports
import database
import auth
import engine
import ai_engine
import schemas


@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    yield


app = FastAPI(title="WarRoomX", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# In-memory user database exactly as requested
USERS_DB = {"admin": auth.hash_password("cyberwar123")}

@app.post("/auth/login", response_model=schemas.TokenResponse)
async def login(req: schemas.LoginRequest):
    if req.username not in USERS_DB:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not auth.verify_password(req.password, USERS_DB[req.username]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = auth.create_access_token(data={"sub": req.username})
    return schemas.TokenResponse(access_token=token)

@app.get("/simulate/full_cycle")
async def simulate_cycle(current_user: str = Depends(auth.get_current_user)):
    # 1. Generate Attack
    attack = engine.generate_attack()
    # 2. Generate Log
    log = engine.generate_log(attack)
    # 3. Detect Threat
    detection = engine.detect_threat(log)
    # 4. Respond
    response = engine.respond(detection, log)
    
    # 5-7. Database Ingest
    database.insert_log(log)
    database.insert_detection(log["log_id"], detection)
    database.insert_response(log["log_id"], response)
    
    # 8. AI Explanation
    if detection["threat"]:
        explanation = ai_engine.explain_threat(log, detection)
    else:
        explanation = {"explanation": "No threat detected.", "severity": "low"}
    
    # 9. Return Unified Flat JSON as requested
    return {
        "attack": attack,
        "log": log,
        "detection": detection,
        "response": response,
        "explanation": explanation
    }

@app.get("/dashboard/stats")
async def get_stats(current_user: str = Depends(auth.get_current_user)):
    return database.get_stats()

@app.get("/dashboard/logs")
async def get_logs(limit: int = 50, current_user: str = Depends(auth.get_current_user)):
    return database.get_recent_logs(limit)

@app.post("/ai/chat", response_model=schemas.ChatResponse)
async def ai_chat(req: schemas.ChatRequest, current_user: str = Depends(auth.get_current_user)):
    context = database.get_stats() if req.include_context else None
    res_data = ai_engine.chat_with_aria(req.message, context, user_id=current_user)
    return schemas.ChatResponse(reply=res_data["reply"])

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    try:
        auth.get_current_user(token)
    except Exception:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    try:
        while True:
            attack = engine.generate_attack()
            log = engine.generate_log(attack)
            detection = engine.detect_threat(log)
            response = engine.respond(detection, log)
            
            database.insert_log(log)
            database.insert_detection(log["log_id"], detection)
            database.insert_response(log["log_id"], response)
            
            payload = {
                "event": {
                    "ip": attack.get("ip"),
                    "type": attack.get("type", attack.get("attack_type")),
                    "timestamp": attack.get("timestamp"),
                    "lat": attack.get("lat"),
                    "lng": attack.get("lng"),
                    "country": attack.get("country", "Unknown")
                },
                "attack": attack,
                "log": log,
                "detection": detection,
                "response": response
            }
            print("Sent via WebSocket:", payload["event"])
            await websocket.send_json(payload)
            await asyncio.sleep(3)
    except Exception:
        # Client disconnect handler
        pass

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
