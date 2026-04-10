from fastapi import APIRouter, Depends, HTTPException
from models import database, schemas
from services import auth, ai_engine

router = APIRouter()

@router.post("/chat", response_model=schemas.ChatResponse)
async def chat_with_aria(req: schemas.ChatRequest, user: str = Depends(auth.get_current_user)):
    try:
        # Get context for ARIA
        logs = database.get_recent_logs(limit=5)
        stats = database.get_stats()
        
        # In modular version, user might be email. Get username for logs.
        user_data = database.get_user_by_email(user)
        username = user_data["username"] if user_data else user
        
        database.log_user_activity(username, "AI_CONSULT", f"Query: {req.message[:50]}...")
        
        response_text = await ai_engine.get_aria_response(req.message, logs, stats)
        return schemas.ChatResponse(reply=response_text)
    except Exception as e:
        print(f"[AI_ROUTE_ERROR] {e}")
        return schemas.ChatResponse(reply="Communications relay offline. ARIA unable to process query.")
