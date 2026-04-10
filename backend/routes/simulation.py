from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from backend.database import db
from backend.models import models
from backend.core import security
from backend.services import simulation_service, detection_service, response_service, ai_service
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
import asyncio
import json

router = APIRouter(prefix="/simulate", tags=["Simulation"])

# Global state for simulation
active_simulation = False
connected_clients = set()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user_role(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        return payload.get("role")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/start")
async def start_sim(role: str = Depends(get_current_user_role)):
    global active_simulation
    active_simulation = True
    return {"status": "RUNNING"}

@router.post("/stop")
async def stop_sim(role: str = Depends(get_current_user_role)):
    global active_simulation
    active_simulation = False
    return {"status": "STOPPED"}

@router.post("/reset")
async def reset_sim(role: str = Depends(get_current_user_role), session: Session = Depends(db.get_db)):
    # Clear DB logs/detections/responses
    session.query(models.Detection).delete()
    session.query(models.Response).delete()
    session.query(models.AIExplanation).delete()
    session.query(models.AttackLog).delete()
    session.commit()
    
    # Reset in-memory states
    detection_service.reset_detection_state()
    response_service.reset_response_state()
    
    return {"status": "RESET_COMPLETE"}

@router.get("/status")
async def get_status():
    return {"status": "RUNNING" if active_simulation else "STOPPED"}

async def simulation_loop():
    global active_simulation
    while True:
        if active_simulation:
            # 1. Generate Attack
            attack_data = simulation_service.generate_random_attack()
            
            # Use a new DB session for background task
            session = db.SessionLocal()
            try:
                log = models.AttackLog(**attack_data)
                session.add(log)
                session.flush() # Get log.id
                
                # 2. Detection
                threat_type, score, reason = detection_service.detect_threat(attack_data)
                detection = models.Detection(log_id=log.id, threat_type=threat_type, confidence_score=score, reason=reason)
                session.add(detection)
                
                # 3. Response
                action, status = response_service.determine_response(attack_data["source_ip"], score)
                res = models.Response(log_id=log.id, action=action, status=status)
                session.add(res)
                
                # 4. AI Explanation
                explanation = ai_service.get_ai_explanation(threat_type, attack_data["payload"], action)
                ai_exp = models.AIExplanation(log_id=log.id, explanation=explanation)
                session.add(ai_exp)
                
                session.commit()
                
                # Broadcoast payload
                payload = {
                    "log": {
                        "id": log.id,
                        "timestamp": log.timestamp.isoformat(),
                        "source_ip": log.source_ip,
                        "country": log.country,
                        "latitude": log.latitude,
                        "longitude": log.longitude,
                        "attack_type": log.attack_type,
                        "payload": log.payload,
                        "raw_log": log.raw_log
                    },
                    "detection": {"threat_type": threat_type, "confidence_score": score, "reason": reason},
                    "response": {"action": action, "status": status},
                    "ai_explanation": explanation
                }
                
                # Broadcast via WS
                for client in list(connected_clients):
                    try:
                        await client.send_json(payload)
                    except Exception:
                        connected_clients.remove(client)
                        
            except Exception as e:
                print(f"Simulation Error: {e}")
                session.rollback()
            finally:
                session.close()
                
        await asyncio.sleep(3)
