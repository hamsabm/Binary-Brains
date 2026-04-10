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

# --- GLOBAL STATE ---
connected_clients = set()
duel_connections: Dict[str, List[WebSocket]] = {} # room_id -> [websockets]
simulation_active = True

async def global_attack_generator():
    while True:
        if simulation_active:
            try:
                attack = engine.generate_attack()
                log = engine.generate_log(attack)
                detection = engine.detect_threat(log)
                response = engine.respond(detection, log)
                database.insert_log(log); database.insert_detection(log["log_id"], detection); database.insert_response(log["log_id"], response)
                
                payload = {
                    "event": {
                        "ip": attack.get("ip"),
                        "type": attack.get("type", attack.get("attack_type")),
                        "timestamp": attack.get("timestamp"),
                        "lat": attack.get("lat"), "lng": attack.get("lng"), "country": attack.get("country", "Unknown")
                    },
                    "attack": attack, "log": log, "detection": detection, "response": response
                }
                
                disconnected = set()
                for client in connected_clients:
                    try:
                        await client.send_json(payload)
                    except Exception:
                        disconnected.add(client)
                for client in disconnected:
                    connected_clients.remove(client)
            except Exception as e:
                print(f"[SIMULATOR ERROR] {e}")
        await asyncio.sleep(2.5)

async def broadcast_to_room(room_id: str, message: dict):
    """Utility to send messages to all players in a specific Duel/Game room."""
    if room_id in duel_connections:
        disconnected = []
        for ws in duel_connections[room_id]:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            duel_connections[room_id].remove(ws)

@asynccontextmanager
async def lifespan(app: FastAPI):
    database.init_db()
    task = asyncio.create_task(global_attack_generator())
    yield
    task.cancel()

app = FastAPI(title="WarRoomX", version="3.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- AUTH & PROFILES ---
USERS_DB = {
    "admin": {"pw": auth.hash_password("cyberwar123"), "role": "admin"},
    "analyst": {"pw": auth.hash_password("analyst123"), "role": "user"}
}

@app.post("/auth/login", response_model=schemas.TokenResponse)
async def login(req: schemas.LoginRequest):
    if req.username not in USERS_DB: raise HTTPException(status_code=401, detail="Invalid credentials")
    user_data = USERS_DB[req.username]
    if not auth.verify_password(req.password, user_data["pw"]): raise HTTPException(status_code=401, detail="Invalid credentials")
    token = auth.create_access_token(data={"sub": req.username, "role": user_data["role"]})
    database.log_user_activity(req.username, "LOGIN", f"Access granted as {user_data['role']}")
    return schemas.TokenResponse(access_token=token)

# --- SIMULATION & STATS ---
@app.get("/dashboard/stats")
async def get_stats(current_user: str = Depends(auth.get_current_user)): return database.get_stats()

@app.get("/dashboard/logs")
async def get_logs(limit: int = 50, current_user: str = Depends(auth.get_current_user)): return database.get_recent_logs(limit)

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

@app.get("/admin/activity")
async def get_activity(current_user: str = Depends(auth.get_current_user)):
    if current_user != "admin": raise HTTPException(status_code=403, detail="Admin protocol required")
    return database.get_all_activity()

# --- LIVE WEBSOCKET ---
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    try:
        auth.get_current_user(token)
    except Exception:
        await websocket.close(code=1008); return
    await websocket.accept()
    connected_clients.add(websocket)
    try:
        while True: await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        if websocket in connected_clients: connected_clients.remove(websocket)

# --- MULTIPLAYER DUEL SYSTEM ---
@app.websocket("/ws/duel/{room_id}")
async def duel_websocket(websocket: WebSocket, room_id: str, player_id: str = Query(...)):
    await websocket.accept()
    success = await game_manager.game_manager.create_or_join_room(room_id, player_id, mode="duel")
    if not success:
        await websocket.close(code=1008); return

    if room_id not in duel_connections: duel_connections[room_id] = []
    duel_connections[room_id].append(websocket)
    
    room = game_manager.game_manager.rooms[room_id]
    role = room["roles"].get(player_id)
    
    await websocket.send_json({"type": "INIT", "role": role, "config": {"timer": room["timer"]}})
    await broadcast_to_room(room_id, {"type": "PLAYER_JOIN", "player_id": player_id, "role": role})

    if len(room["players"]) == 2:
        asyncio.create_task(game_manager.game_manager.run_game_loop(room_id, lambda msg: broadcast_to_room(room_id, msg)))

    try:
        while True:
            data = await websocket.receive_json()
            if data["type"] == "LAUNCH_ATTACK" and role == "attacker":
                attack_data = game_manager.game_manager.launch_manual_attack(room_id, player_id, data["attack_type"])
                if attack_data:
                    await broadcast_to_room(room_id, {"type": "ATTACK_SYNC", "data": attack_data})
            
            elif data["type"] == "SUBMIT_DEFENSE" and role == "defender":
                result = game_manager.game_manager.process_duel_action(room_id, player_id, data["action"], data["attack_id"])
                if result:
                    database.log_user_activity(player_id, "GAME_ACTION", f"Duel Action: {data['action']}")
                    await broadcast_to_room(room_id, {"type": "ACTION_RESULT", "data": result})
    except Exception:
        if room_id in duel_connections:
            if websocket in duel_connections[room_id]: duel_connections[room_id].remove(websocket)

@app.get("/duel/status/{room_id}")
async def duel_status(room_id: str):
    room = game_manager.game_manager.rooms.get(room_id)
    if not room: return {"status": "VOID"}
    return {"status": "ACTIVE", "players": len(room["players"]), "mode": room["mode"]}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
