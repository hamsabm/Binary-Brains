from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import db
from backend.models import models
from backend.core import security
from backend.schemas import schemas
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=schemas.Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(db.get_db)):
    user = session.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = security.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@router.post("/register")
async def register(user_in: schemas.UserCreate, session: Session = Depends(db.get_db)):
    existing = session.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = models.User(
        email=user_in.email,
        password_hash=security.get_password_hash(user_in.password),
        role="user"
    )
    session.add(new_user)
    session.commit()
    return {"message": "User created successfully"}
