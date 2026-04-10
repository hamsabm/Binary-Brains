from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from backend.database import db
from backend.models import models
from backend.services import ai_service, response_service
from backend.schemas import schemas

router = APIRouter(prefix="/aria", tags=["ARIA"])

@router.post("/chat")
async def aria_chat(query: str = Body(..., embed=True), session: Session = Depends(db.get_db)):
    # Fetch some context: recent logs and stats
    logs = session.query(models.AttackLog).order_by(models.AttackLog.timestamp.desc()).limit(10).all()
    log_summaries = [{"type": l.attack_type, "ip": l.source_ip, "country": l.country} for l in logs]
    
    status = "Active and Monitoring"
    
    response = ai_service.get_aria_response(query, log_summaries, status)
    return {"reply": response}
