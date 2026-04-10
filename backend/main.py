from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.db import init_db, SessionLocal
from backend.models.models import User
from backend.core.security import get_password_hash
from backend.routes import auth, simulation, dashboard, aria, websocket
from contextlib import asynccontextmanager
import asyncio
from backend.routes.simulation import simulation_loop
import backend.models.models as models

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB
    init_db()
    
    # Pre-seed users
    session = SessionLocal()
    try:
        admin = session.query(User).filter(User.email == "admin@cyberwarroom.com").first()
        if not admin:
            session.add(User(
                email="admin@cyberwarroom.com",
                password_hash=get_password_hash("Admin@123"),
                role="admin"
            ))
        
        user = session.query(User).filter(User.email == "user@cyberwarroom.com").first()
        if not user:
            session.add(User(
                email="user@cyberwarroom.com",
                password_hash=get_password_hash("User@123"),
                role="user"
            ))
        
        # --- DEMO MODE SEEDING ---
        if session.query(models.AttackLog).count() == 0:
            from backend.services import simulation_service, detection_service, response_service, ai_service
            for _ in range(10):
                attack_data = simulation_service.generate_random_attack()
                log = models.AttackLog(**attack_data)
                session.add(log)
                session.flush()
                
                threat_type, score, reason = detection_service.detect_threat(attack_data)
                det = models.Detection(log_id=log.id, threat_type=threat_type, confidence_score=score, reason=reason)
                session.add(det)
                
                action, status = response_service.determine_response(attack_data["source_ip"], score)
                res = models.Response(log_id=log.id, action=action, status=status)
                session.add(res)
                
                # Mock AI for demo seeding to avoid API calls on startup
                explanation = "DEMO: " + ai_service.FALLBACK_EXPLANATIONS.get(threat_type, "Protocols engaged.")
                ai_exp = models.AIExplanation(log_id=log.id, explanation=explanation)
                session.add(ai_exp)

        session.commit()
    finally:
        session.close()
    
    # Start simulation background task
    bg_task = asyncio.create_task(simulation_loop())
    
    yield
    
    # Clean up
    bg_task.cancel()

app = FastAPI(title="AI Cyber War Room", description="Where AI Attacks, Defends, and Explains")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(simulation.router)
app.include_router(dashboard.router)
app.include_router(aria.router)
app.include_router(websocket.router)

@app.get("/")
async def root():
    return {"message": "AI Cyber War Room API is active"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
