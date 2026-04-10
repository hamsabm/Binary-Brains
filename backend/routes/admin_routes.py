from fastapi import APIRouter, Depends, HTTPException
from models import database
from services import auth

router = APIRouter()

@router.get("/activity")
async def get_activity(user: str = Depends(auth.get_current_user)):
    # Optional: Check if user is admin
    user_data = database.get_user_by_email(user)
    if not user_data or user_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Operator clearancelvl required: ADMIN")
    return database.get_all_activity()
