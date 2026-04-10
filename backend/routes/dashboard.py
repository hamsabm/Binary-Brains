from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import db
from backend.models import models
from backend.core import security
from sqlalchemy import func

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_stats(session: Session = Depends(db.get_db)):
    total_attacks = session.query(models.AttackLog).count()
    threat_counts = session.query(models.Detection.threat_type, func.count(models.Detection.id)).group_by(models.Detection.threat_type).all()
    
    # Simple alert format for charts
    alerts = [{"name": t[0], "value": t[1]} for t in threat_counts if t[0] != "None"]
    
    return {
        "total_threats": total_attacks,
        "active_blocks": session.query(models.Response).filter(models.Response.action == "BLOCK").count(),
        "threat_distribution": alerts
    }

@router.get("/logs")
async def get_recent_logs(limit: int = 50, session: Session = Depends(db.get_db)):
    logs = session.query(models.AttackLog).order_by(models.AttackLog.timestamp.desc()).limit(limit).all()
    result = []
    for log in logs:
        detection = session.query(models.Detection).filter(models.Detection.log_id == log.id).first()
        response = session.query(models.Response).filter(models.Response.log_id == log.id).first()
        ai = session.query(models.AIExplanation).filter(models.AIExplanation.log_id == log.id).first()
        
        result.append({
            "id": log.id,
            "timestamp": log.timestamp.isoformat(),
            "source_ip": log.source_ip,
            "attack_type": log.attack_type,
            "country": log.country,
            "confidence_score": detection.confidence_score if detection else 0,
            "action": response.action if response else "NONE",
            "explanation": ai.explanation if ai else "Pending..."
        })
    return result
