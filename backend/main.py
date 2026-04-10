import os
from dotenv import load_dotenv; load_dotenv()
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import asyncio
import time
from datetime import datetime

# Local Imports
import database
import auth
import engine
import ai_engine
import schemas
import game_manager

# --- GLOBAL SIMULATION STATE ---
connected_clients = set()
simulation_active = True

async def global_attack_generator():
    """Independent background task that generates attacks every 2-3 seconds."""
    while True:
        if simulation_active:
            try:
                # 1. Generate core tactical data
                attack = engine.generate_attack()
                log = engine.generate_log(attack)
                detection = engine.detect_threat(log)
                response = engine.respond(detection, log)
                
                # 2. Database persistence
                database.insert_log(log)
                database.insert_detection(log["log_id"], detection)
                database.insert_response(log["log_id"], response)
                
                # 3. Construct unified broadcast payload
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
                
                print(f"[SIMULATOR] Generated attack from {payload['event']['ip']} - Type: {payload['event']['type']}")
                
                # 4. Broadcast to all active WebSocket clients
                disconnected = set()
                for client in connected_clients:
                    try:
                        await client.send_json(payload)
                    except Exception:
                        disconnected.add(client)
                
                # Cleanup dead links
                for client in disconnected:
                    connected_clients.remove(client)
                    
            except Exception as e:
                print(f"[SIMULATOR ERROR] {e}")
        
        await asyncio.sleep(2.5) # The requested 2-3 second cadence

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB
    database.init_db()
    # Start Global Simulation Task
    task = asyncio.create_task(global_attack_generator())
    yield
    # Cleanup on shutdown
    task.cancel()


app = FastAPI(title="WarRoomX", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Expanded User DB with Roles
USERS_DB = {
    "admin": {"pw": auth.hash_password("cyberwar123"), "role": "admin"},
    "analyst": {"pw": auth.hash_password("analyst123"), "role": "user"}
}

@app.post("/auth/login", response_model=schemas.TokenResponse)
async def login(req: schemas.LoginRequest):
    if req.username not in USERS_DB:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_data = USERS_DB[req.username]
    if not auth.verify_password(req.password, user_data["pw"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = auth.create_access_token(data={"sub": req.username, "role": user_data["role"]})
    
    # Log the login event
    database.log_user_activity(req.username, "LOGIN", f"Access granted as {user_data['role']}")
    
    return schemas.TokenResponse(access_token=token)

@app.get("/simulate/full_cycle")
async def simulate_cycle(current_user: str = Depends(auth.get_current_user)):
    attack = engine.generate_attack()
    log = engine.generate_log(attack)
    detection = engine.detect_threat(log)
    response = engine.respond(detection, log)
    database.insert_log(log); database.insert_detection(log["log_id"], detection); database.insert_response(log["log_id"], response)
    explanation = ai_engine.explain_threat(log, detection) if detection["threat"] else {"explanation": "Normal traffic.", "severity": "low"}
    return {"attack": attack, "log": log, "detection": detection, "response": response, "explanation": explanation}

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

@app.post("/simulate/toggle")
async def toggle_simulation(active: bool, current_user: str = Depends(auth.get_current_user)):
    global simulation_active
    simulation_active = active
    return {"status": "simulation_updated", "active": simulation_active}

@app.post("/simulate/start")
async def start_sim_endpoint(current_user: str = Depends(auth.get_current_user)):
    global simulation_active
    simulation_active = True
    database.log_user_activity(current_user, "SIM_START", "Manual simulation trigger")
    return {"status": "started"}

@app.post("/simulate/stop")
async def stop_sim_endpoint(current_user: str = Depends(auth.get_current_user)):
    global simulation_active
    simulation_active = False
    database.log_user_activity(current_user, "SIM_STOP", "Manual simulation halt")
    return {"status": "stopped"}

# --- PRIMARY BROADCAST WEBSOCKET ---
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    try:
        auth.get_current_user(token)
    except Exception:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    connected_clients.add(websocket)
    print(f"[WEBSOCKET] Client connected. Total active: {len(connected_clients)}")
    
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        if websocket in connected_clients:
            connected_clients.remove(websocket)
        print(f"[WEBSOCKET] Client disconnected. Total active: {len(connected_clients)}")

# --- MULTIPLAYER GAME ENDPOINTS ---
@app.websocket("/ws/game/{room_id}")
async def game_websocket(websocket: WebSocket, room_id: str, player_id: str = Query(...)):
    await websocket.accept()
    success = await game_manager.game_manager.create_or_join_room(room_id, player_id)
    if not success:
        await websocket.close(code=1008); return

    try:
        while True:
            room = game_manager.game_manager.rooms.get(room_id)
            if not room: break
            if not room["boss_wave"]:
                attack = engine.generate_attack()
                log = engine.generate_log(attack)
                detection = engine.detect_threat(log)
                room["current_attack"] = {"attack": attack, "log": log, "detection": detection, "timestamp_start": time.time()}
                await websocket.send_json({"type": "ATTACK", "data": room["current_attack"]})
                if len(room["history"]) % 20 == 0 and len(room["history"]) > 0:
                    asyncio.create_task(game_manager.game_manager.run_boss_wave(room_id, websocket.send_json))
                room["history"].append(attack)
            await asyncio.sleep(5)
    except Exception:
        if room_id in game_manager.game_manager.rooms:
            if player_id in game_manager.game_manager.rooms[room_id]["players"]:
                del game_manager.game_manager.rooms[room_id]["players"][player_id]
            if not game_manager.game_manager.rooms[room_id]["players"]:
                del game_manager.game_manager.rooms[room_id]

@app.get("/admin/activity")
async def get_activity(current_user: str = Depends(auth.get_current_user)):
    # Simple role check for demo
    if current_user != "admin":
        raise HTTPException(status_code=403, detail="Admin protocol required")
    return database.get_all_activity()

@app.post("/game/action")
async def register_action(room_id: str, player_id: str, action: str, attack_id: str, current_user: str = Depends(auth.get_current_user)):
    result = game_manager.game_manager.process_action(room_id, player_id, action, attack_id)
    if not result: raise HTTPException(status_code=400, detail="Invalid action or attack expired")
    
    # Log game action
    database.log_user_activity(current_user, "GAME_ACTION", f"Action: {action} | Result: {result['is_correct']}")
    
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
