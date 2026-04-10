import random
import uuid
import datetime
from faker import Faker

fake = Faker()

def generate_attack():
    """3. ATTACK SIMULATION ENGINE"""
    # Attack types: SQL Injection, Brute Force
    type = random.choice(["SQL Injection", "Brute Force"])
    ip = fake.ipv4()
    
    payloads = {
        "SQL Injection": random.choice([
            "admin' OR 1=1 --",
            "'; DROP TABLE users; --",
            "' UNION SELECT username, password FROM users --",
            "1' AND SLEEP(5) --"
        ]),
        "Brute Force": f"Attempt {random.randint(1,10)}: user='admin' pass='{fake.password()}'"
    }
    
    return {
        "id": str(uuid.uuid4()),
        "ip": ip,
        "type": type,
        "payload": payloads[type],
        "timestamp": datetime.datetime.now().isoformat(),
        "country": fake.country(),
        "lat": random.uniform(-60, 80),
        "lng": random.uniform(-180, 180)
    }

def generate_log(attack):
    """4. LOG GENERATION"""
    raw = f'[{attack["timestamp"]}] {attack["ip"]} - "POST /login HTTP/1.1" 401 "{attack["payload"]}"'
    return {
        "log_id": attack["id"],
        "timestamp": attack["timestamp"],
        "ip": attack["ip"],
        "country": attack["country"],
        "event": "Authentication Attempt",
        "attack_type": attack["type"].lower().replace(" ", "_"),
        "payload": attack["payload"],
        "raw_log": raw
    }


def detect_threat(log):
    """5. DETECTION ENGINE (STRICT RULE-BASED)"""
    payload = log["payload"].upper()
    threat = "NORMAL"
    confidence = 0
    reason = "Traffic baseline within normal parameters"
    
    # SQL INJECTION STRICT LOGIC
    sqli_keywords = ["SELECT", "UNION", "OR 1=1", "DROP", "--"]
    if any(k in payload for k in sqli_keywords):
        threat = "SQL Injection"
        confidence = 95
        reason = f"Illegal SQL primitives identified in payload: {payload[:20]}"
    
    # BRUTE FORCE STRICT LOGIC
    elif "ATTEMPT" in payload:
        attempts = int(payload.split(':')[0].split(' ')[1])
        threat = "Brute Force"
        confidence = 30 + (attempts * 7) # Scales up to 100
        reason = f"Repeated unauthorized access attempts ({attempts} consecutive failure points)"

    priority = "CRITICAL" if confidence > 85 else "WARNING" if confidence > 50 else "INFO"

    return {
        "threat": threat,
        "confidence": min(confidence, 100),
        "priority": priority,
        "reason": reason,
        "recommended_action": "BLOCK" if confidence > 85 else "RATE_LIMIT" if confidence > 50 else "IGNORE",
        "profile": {"type": "Malicious Script" if confidence > 50 else "Anomaly"},
        "risk": {"score": confidence, "label": "HIGH_RISK" if confidence > 80 else "LOW_RISK"}
    }


def respond(detection, log):
    """6. RESPONSE ENGINE (AUTOMATED)"""
    conf = detection["confidence"]
    if conf > 85:
        action = "BLOCK_IP"
        reason = "Automated high-confidence firewall saturation."
    elif conf > 50:
        action = "RATE_LIMIT"
        reason = "Behavioral throttling engaged for pattern deviation."
    else:
        action = "FLAG"
        reason = "Low-confidence anomaly marked for analyst triage."
        
    return {"action": action, "reason": reason}
