from fastapi import APIRouter, Depends, HTTPException
from models import database
from services import auth

router = APIRouter()
sim_router = APIRouter()

@router.get("/stats")
async def get_stats(user: str = Depends(auth.get_current_user)):
    return database.get_stats()

@router.get("/logs")
async def get_logs(limit: int = 50, user: str = Depends(auth.get_current_user)):
    return database.get_recent_logs(limit)

@sim_router.post("/start")
async def start_sim(user: str = Depends(auth.get_current_user)):
    database.simulation_active = True
    database.log_user_activity(user, "SIM_START", "Manual tactical override")
    return {"status": "started", "active": True}

@sim_router.post("/stop")
async def stop_sim(user: str = Depends(auth.get_current_user)):
    database.simulation_active = False
    database.log_user_activity(user, "SIM_STOP", "Manual tactical override")
    return {"status": "stopped", "active": False}
