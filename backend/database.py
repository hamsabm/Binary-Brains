from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, Boolean, DateTime, select, insert, func, desc, text
from sqlalchemy.sql import and_
import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./war_room.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
metadata = MetaData()

attack_logs = Table(
    "attack_logs",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("log_id", String, unique=True),
    Column("ip", String),
    Column("event", String),
    Column("status", String),
    Column("attack_type", String),
    Column("timestamp", String),
)

detections = Table(
    "detections",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("log_id", String),
    Column("threat", Boolean),
    Column("confidence", Integer),
    Column("reason", String),
    Column("timestamp", String),
)

responses = Table(
    "responses",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("log_id", String),
    Column("action", String),
    Column("message", String),
    Column("status", String),
    Column("timestamp", String),
)

user_activity = Table(
    "user_activity",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("username", String),
    Column("action", String),
    Column("details", String),
    Column("timestamp", DateTime, default=datetime.datetime.utcnow),
)

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True, autoincrement=True),
    Column("username", String, unique=True),
    Column("password", String),
    Column("role", String, default="user"),
    Column("created_at", DateTime, default=datetime.datetime.utcnow),
)

def init_db():
    metadata.create_all(engine)
    # Check if we need to insert default users
    with engine.connect() as conn:
        res = conn.execute(select(func.count()).select_from(users)).scalar()
        if res == 0:
            import auth
            # Admin
            conn.execute(insert(users).values(username="admin", password=auth.hash_password("cyberwar123"), role="admin"))
            # Defaults
            conn.execute(insert(users).values(username="user1", password=auth.hash_password("user123"), role="user"))
            conn.execute(insert(users).values(username="user2", password=auth.hash_password("user123"), role="user"))
            conn.commit()

def insert_user(username, password, role="user"):
    with engine.connect() as conn:
        conn.execute(insert(users).values(username=username, password=password, role=role))
        conn.commit()

def get_user(username):
    with engine.connect() as conn:
        stmt = select(users).where(users.c.username == username)
        result = conn.execute(stmt).first()
        return dict(result._mapping) if result else None

def insert_log(log_dict: dict):
    with engine.connect() as conn:
        try:
            stmt = insert(attack_logs).values(**log_dict)
            conn.execute(stmt)
            conn.commit()
        except Exception:
            # Ignore if log_id exists
            pass

def insert_detection(log_id: str, det: dict):
    with engine.connect() as conn:
        stmt = insert(detections).values(log_id=log_id, **det)
        conn.execute(stmt)
        conn.commit()

def insert_response(log_id: str, resp: dict):
    with engine.connect() as conn:
        stmt = insert(responses).values(log_id=log_id, **resp)
        conn.execute(stmt)
        conn.commit()

def get_recent_logs(limit=50):
    with engine.connect() as conn:
        query = (
            select(
                attack_logs,
                detections.c.threat,
                detections.c.confidence,
                responses.c.action
            )
            .select_from(
                attack_logs
                .outerjoin(detections, attack_logs.c.log_id == detections.c.log_id)
                .outerjoin(responses, attack_logs.c.log_id == responses.c.log_id)
            )
            .order_by(desc(attack_logs.c.id))
            .limit(limit)
        )
        result = conn.execute(query)
        return [dict(row._mapping) for row in result]

def get_stats():
    with engine.connect() as conn:
        total_events = conn.execute(select(func.count()).select_from(attack_logs)).scalar()
        threats_detected = conn.execute(
            select(func.count())
            .select_from(detections)
            .where(detections.c.threat == True)
        ).scalar()
        ips_blocked = conn.execute(
            select(func.count())
            .select_from(responses)
            .where(responses.c.action == 'block_ip')
        ).scalar()
        sql_count = conn.execute(
            select(func.count())
            .select_from(attack_logs)
            .where(attack_logs.c.attack_type == 'sql_injection')
        ).scalar()
        brute_count = conn.execute(
            select(func.count())
            .select_from(attack_logs)
            .where(attack_logs.c.attack_type == 'brute_force')
        ).scalar()

        return {
            "total_events": total_events or 0,
            "threats_detected": threats_detected or 0,
            "ips_blocked": ips_blocked or 0,
            "sql_count": sql_count or 0,
            "brute_count": brute_count or 0
        }

def log_user_activity(username: str, action: str, details: str = ""):
    with engine.connect() as conn:
        stmt = insert(user_activity).values(username=username, action=action, details=details)
        conn.execute(stmt)
        conn.commit()

def get_all_activity(limit=100):
    with engine.connect() as conn:
        query = select(user_activity).order_by(desc(user_activity.c.id)).limit(limit)
        result = conn.execute(query)
        return [dict(row._mapping) for row in result]
