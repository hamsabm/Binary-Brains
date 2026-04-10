from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str

class AttackBase(BaseModel):
    source_ip: str
    country: str
    latitude: float
    longitude: float
    attack_type: str
    payload: str
    timestamp: datetime

class DetectionResponse(BaseModel):
    threat_type: str
    confidence_score: float
    reason: str

class ActionResponse(BaseModel):
    action: str
    status: str
