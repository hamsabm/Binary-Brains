from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from services import simulation_service, auth

router = APIRouter()

@router.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...)):
    """9. REAL-TIME SYSTEM (WebSocket Stream)"""
    try:
        # 11. ERROR HANDLING - Token Validation
        auth.decode_token(token)
    except:
        await websocket.close(code=1008)
        return

    await websocket.accept()
    simulation_service.connected_clients.add(websocket)
    try:
        while True:
            # Maintain connection
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        if websocket in simulation_service.connected_clients:
            simulation_service.connected_clients.remove(websocket)
