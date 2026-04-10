from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    role = Column(String) # "admin" or "user"

class AttackLog(Base):
    __tablename__ = "attack_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    source_ip = Column(String)
    country = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    attack_type = Column(String) # SQL Injection, Brute Force, XSS
    payload = Column(String)
    raw_log = Column(String)

class Detection(Base):
    __tablename__ = "detections"
    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("attack_logs.id"))
    threat_type = Column(String)
    confidence_score = Column(Float)
    reason = Column(String)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)

class Response(Base):
    __tablename__ = "responses"
    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("attack_logs.id"))
    action = Column(String) # BLOCK, RATE LIMIT, FLAG
    status = Column(String) # SUCCESS, PENDING
    performed_at = Column(DateTime, default=datetime.datetime.utcnow)

class AIExplanation(Base):
    __tablename__ = "ai_explanations"
    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("attack_logs.id"))
    explanation = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
