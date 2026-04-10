from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import asyncio
import uuid
from services import game_manager, auth

router = APIRouter()

# --- SHARED STATE HELPERS ---
async def broadcast_lobby_state():
    state = {
        "type": "LOBBY_STATE", 
        "users": list(game_manager.game_manager.online_users.values()), 
        "queue_count": len(game_manager.game_manager.matchmaking_queue)
    }
    disconnected = []
    for player_id, ws in game_manager.game_manager.lobby_connections.items():
        try:
            await ws.send_json(state)
        except Exception:
            disconnected.append(player_id)
    
    for pid in disconnected:
        if pid in game_manager.game_manager.lobby_connections:
            del game_manager.game_manager.lobby_connections[pid]

async def broadcast_to_room(room_id: str, message: dict):
    if room_id in game_manager.game_manager.duel_connections:
        disconnected = []
        for ws in game_manager.game_manager.duel_connections[room_id]:
            try:
                await ws.send_json(message)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            game_manager.game_manager.duel_connections[room_id].remove(ws)

# --- WEB SOCKETS ---
@router.websocket("/ws/lobby")
async def lobby_endpoint(websocket: WebSocket, player_id: str = Query(...)):
    await websocket.accept()
    
    # Initialize connection tracking if not present
    if not hasattr(game_manager.game_manager, 'lobby_connections'):
        game_manager.game_manager.lobby_connections = {}
    
    game_manager.game_manager.lobby_connections[player_id] = websocket
    game_manager.game_manager.online_users[player_id] = {
        "id": player_id, 
        "username": player_id, 
        "status": "Available"
    }
    
    await broadcast_lobby_state()
    
    try:
        while True:
            data = await websocket.receive_json()
            if data["type"] == "INVITE":
                target_id = data["to"]
                if target_id in game_manager.game_manager.lobby_connections:
                    await game_manager.game_manager.lobby_connections[target_id].send_json({
                        "type": "INVITE_RECEIVED", 
                        "from": player_id, 
                        "room_id": f"DUEL_{player_id}_{target_id}"
                    })
            elif data["type"] == "JOIN_QUEUE":
                if player_id not in game_manager.game_manager.matchmaking_queue:
                    game_manager.game_manager.matchmaking_queue.append(player_id)
                    game_manager.game_manager.online_users[player_id]["status"] = "Matching"
                    
                    if len(game_manager.game_manager.matchmaking_queue) >= 2:
                        p1 = game_manager.game_manager.matchmaking_queue.pop(0)
                        p2 = game_manager.game_manager.matchmaking_queue.pop(0)
                        room_id = f"RND_{uuid.uuid4().hex[:8]}"
                        match_msg = {"type": "MATCH_FOUND", "room_id": room_id}
                        
                        if p1 in game_manager.game_manager.lobby_connections:
                            await game_manager.game_manager.lobby_connections[p1].send_json(match_msg)
                        if p2 in game_manager.game_manager.lobby_connections:
                            await game_manager.game_manager.lobby_connections[p2].send_json(match_msg)
                
                await broadcast_lobby_state()
    except Exception:
        if player_id in game_manager.game_manager.lobby_connections:
            del game_manager.game_manager.lobby_connections[player_id]
        if player_id in game_manager.game_manager.online_users:
            del game_manager.game_manager.online_users[player_id]
        if player_id in game_manager.game_manager.matchmaking_queue:
            game_manager.game_manager.matchmaking_queue.remove(player_id)
        await broadcast_lobby_state()

@router.websocket("/ws/duel/{room_id}")
async def duel_websocket(websocket: WebSocket, room_id: str, player_id: str = Query(...)):
    await websocket.accept()
    
    # Initialize connection tracking if not present
    if not hasattr(game_manager.game_manager, 'duel_connections'):
        game_manager.game_manager.duel_connections = {}
    
    success = await game_manager.game_manager.create_or_join_room(room_id, player_id, mode="duel")
    if not success:
        await websocket.close(code=1008)
        return
        
    if room_id not in game_manager.game_manager.duel_connections:
        game_manager.game_manager.duel_connections[room_id] = []
    
    game_manager.game_manager.duel_connections[room_id].append(websocket)
    room = game_manager.game_manager.rooms[room_id]
    role = room["roles"].get(player_id)
    
    if player_id in game_manager.game_manager.online_users:
        game_manager.game_manager.online_users[player_id]["status"] = "In Game"
        await broadcast_lobby_state()
        
    await websocket.send_json({
        "type": "INIT", 
        "role": role, 
        "config": {"timer": room["timer"]}
    })
    
    await broadcast_to_room(room_id, {
        "type": "PLAYER_JOIN", 
        "player_id": player_id, 
        "role": role
    })
    
    # Start loop if 2 players
    if len(room["players"]) == 2:
        asyncio.create_task(game_manager.game_manager.run_game_loop(
            room_id, 
            lambda msg: broadcast_to_room(room_id, msg)
        ))
        
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
                    await broadcast_to_room(room_id, {"type": "ACTION_RESULT", "data": result})
    except Exception:
        if room_id in game_manager.game_manager.duel_connections and websocket in game_manager.game_manager.duel_connections[room_id]:
            game_manager.game_manager.duel_connections[room_id].remove(websocket)
        if player_id in game_manager.game_manager.online_users:
            game_manager.game_manager.online_users[player_id]["status"] = "Available"
            await broadcast_lobby_state()
