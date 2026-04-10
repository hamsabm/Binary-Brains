from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from backend.models.models import Base, User, AttackLog, Detection, Response, AIExplanation

DATABASE_URL = "sqlite:///./war_room_v3.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
