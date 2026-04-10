import datetime
import os
from sqlalchemy import create_all, create_engine, MetaData, Table, Column, Integer, String, DateTime, Float, JSON, insert, select, func
from sqlalchemy.orm import sessionmaker

DB_URL = "sqlite:///./war_room.db"
engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
metadata = MetaData()

# SHARED STATE (Simulation should NOT auto-start)
simulation_active = False

# --- TABLES ---
users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("email", String, unique=True),
    Column("username", String),
    Column("password", String),
    Column("role", String, default="user"),
    Column("created_at", DateTime, default=datetime.datetime.utcnow),
)

attack_logs = Table(
    "attack_logs",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("log_id", String, unique=True),
    Column("timestamp", String),
    Column("ip", String),
    Column("country", String),
    Column("event", String),
    Column("attack_type", String),
    Column("payload", String),
    Column("raw_log", String),
)

detections = Table(
    "detections",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("log_id", String),
    Column("threat", String),
    Column("confidence", Float),
    Column("priority", String),
    Column("reason", String),
    Column("explanation", String),
    Column("profile", JSON),
    Column("risk", JSON),
)

responses = Table(
    "responses",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("log_id", String),
    Column("action", String),
    Column("reason", String),
    Column("status", String, default="EXECUTED"),
)

user_activity = Table(
    "user_activity",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String),
    Column("action", String),
    Column("details", String),
    Column("timestamp", DateTime, default=datetime.datetime.utcnow),
)

def init_db():
    metadata.create_all(engine)
    with engine.connect() as conn:
        count = conn.execute(select(func.count()).select_from(users)).scalar()
        if count == 0:
            from services.auth import hash_password
            conn.execute(insert(users).values(email="admin@cyber.com", username="admin", password=hash_password("cyberwar123"), role="admin"))
            conn.execute(insert(users).values(email="user@cyber.com", username="user1", password=hash_password("user123"), role="user"))
            conn.commit()

def insert_user(email, username, password, role="user"):
    with engine.connect() as conn:
        conn.execute(insert(users).values(email=email, username=username, password=password, role=role))
        conn.commit()

def get_user_by_email(email):
    with engine.connect() as conn:
        stmt = select(users).where(users.c.email == email)
        result = conn.execute(stmt).first()
        return dict(result._mapping) if result else None

def get_stats():
    with engine.connect() as conn:
        total = conn.execute(select(func.count()).select_from(attack_logs)).scalar()
        threats = conn.execute(select(func.count()).select_from(detections)).scalar()
        blocked = conn.execute(select(func.count()).select_from(responses).where(responses.c.action == "BLOCK_IP")).scalar()
        return {"total_events": total, "threats_detected": threats, "ips_blocked": blocked}

def insert_log(l):
    with engine.connect() as conn:
        conn.execute(insert(attack_logs).values(**l))
        conn.commit()

def insert_detection(log_id, d):
    with engine.connect() as conn:
        conn.execute(insert(detections).values(log_id=log_id, **d))
        conn.commit()

def insert_response(log_id, r):
    with engine.connect() as conn:
        conn.execute(insert(responses).values(log_id=log_id, **r))
        conn.commit()

def log_user_activity(user, action, details):
    with engine.connect() as conn:
        conn.execute(insert(user_activity).values(username=user, action=action, details=details))
        conn.commit()

def get_recent_logs(limit=50):
    with engine.connect() as conn:
        stmt = select(attack_logs, detections, responses).select_from(
            attack_logs.join(detections, attack_logs.c.log_id == detections.c.log_id)
            .join(responses, attack_logs.c.log_id == responses.c.log_id)
        ).order_by(attack_logs.c.id.desc()).limit(limit)
        results = conn.execute(stmt).all()
        return [dict(r._mapping) for r in results]

def get_all_activity():
    with engine.connect() as conn:
        stmt = select(user_activity).order_by(user_activity.c.id.desc())
        return [dict(r._mapping) for r in conn.execute(stmt).all()]
