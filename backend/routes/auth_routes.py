from fastapi import APIRouter, HTTPException, Depends
from models import database, schemas
from services import auth

router = APIRouter()

@app.post("/register")
async def register(req: schemas.LoginRequest):
    if database.get_user_by_email(req.username): # Note: frontend sends email as username in common login patterns
        raise HTTPException(status_code=400, detail="Identity ID already registered")
    hashed_pw = auth.hash_password(req.password)
    # Map 'username' to 'email' in our new schema
    database.insert_user(email=req.username, username=req.username.split('@')[0], password=hashed_pw)
    database.log_user_activity(req.username, "REGISTER", "Neural identity self-provisioned")
    return {"status": "identity_created"}

@app.post("/login", response_model=schemas.TokenResponse)
async def login(req: schemas.LoginRequest):
    user_data = database.get_user_by_email(req.username)
    if not user_data:
        raise HTTPException(status_code=401, detail="Identity not found in neural pool")
    if not auth.verify_password(req.password, user_data["password"]):
        raise HTTPException(status_code=401, detail="Authentication protocol failed")
    
    token = auth.create_access_token(data={"sub": user_data["email"], "role": user_data["role"]})
    database.log_user_activity(user_data["username"], "LOGIN", f"Access granted as {user_data['role']}")
    return schemas.TokenResponse(access_token=token)
