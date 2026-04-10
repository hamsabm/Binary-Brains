from faker import Faker
import random
import uuid
from datetime import datetime
import re
import json
import logging
import urllib.request
import urllib.parse
from collections import Counter

faker_instance = Faker()
logger = logging.getLogger(__name__)

# STATIC PAYLOADS
SQL_PAYLOADS = [
  "' OR '1'='1", "'; DROP TABLE users;--", "' UNION SELECT null,null--",
  "admin'--", "' OR 1=1--", "1; SELECT * FROM users", "' AND 1=0 UNION SELECT username,password FROM users--",
  "'; INSERT INTO users VALUES('hacker','hacked');--", "' OR 'x'='x",
  "1' ORDER BY 3--", "' UNION SELECT table_name FROM information_schema.tables--",
  "'; EXEC xp_cmdshell('dir');--", "' OR EXISTS(SELECT * FROM users)--",
  "1 AND 1=2 UNION SELECT 1,@@version--", "' AND SLEEP(5)--"
]

BRUTE_PAYLOADS = [
  "admin:password123", "root:123456", "admin:admin", "user:qwerty",
  "administrator:letmein", "admin:pass", "root:root", "test:test123",
  "admin:12345678", "user:password", "guest:guest", "operator:operator",
  "admin:welcome1", "sysadmin:sysadmin", "manager:manager123"
]

PORT_SCAN_PAYLOADS = [
  "nmap -sS -Pn 10.0.0.1",
  "masscan 10.0.0.0/24 -p1-1024 --rate 1000",
  "SYN probe burst to ports 21,22,23,80,443,3389",
  "TCP connect scan against edge gateway",
  "UDP scan for DNS/NTP amplification vectors"
]

# STATE TRACKING
ip_attempt_count = {}
blocked_ips = set()
geo_cache = {}
user_score = 1000  # Starting gamified score
recent_types = []  # For prediction
attacker_profiles = {}  # Per IP profiling

GLOBAL_CITIES = [
    {"name": "New York", "lat": 40.7128, "lng": -74.0060},
    {"name": "London", "lat": 51.5074, "lng": -0.1278},
    {"name": "Tokyo", "lat": 35.6895, "lng": 139.6917},
    {"name": "Sydney", "lat": -33.8688, "lng": 151.2093},
    {"name": "Sao Paulo", "lat": -23.5505, "lng": -46.6333},
    {"name": "Moscow", "lat": 55.7558, "lng": 37.6173},
    {"name": "Cape Town", "lat": -33.9249, "lng": 18.4241},
    {"name": "Frankfurt", "lat": 50.1109, "lng": 8.6821},
    {"name": "Singapore", "lat": 1.3521, "lng": 103.8198},
    {"name": "San Francisco", "lat": 37.7749, "lng": -122.4194},
    {"name": "Paris", "lat": 48.8566, "lng": 2.3522},
    {"name": "Mumbai", "lat": 19.0760, "lng": 72.8777},
    {"name": "Seoul", "lat": 37.5665, "lng": 126.9780},
    {"name": "Berlin", "lat": 52.5200, "lng": 13.4050},
    {"name": "Toronto", "lat": 43.6532, "lng": -79.3832}
]

def _fallback_location(ip: str) -> dict:
  seeded = random.Random(abs(hash(ip)) % (2**32))
  city = seeded.choice(GLOBAL_CITIES)
  return {
      "lat": city["lat"] + seeded.uniform(-0.5, 0.5),
      "lng": city["lng"] + seeded.uniform(-0.5, 0.5),
      "country": "Simulated"
  }

def get_location(ip: str) -> dict:
  cached = geo_cache.get(ip)
  if cached: return cached
  url = f"https://ipapi.co/{urllib.parse.quote(ip)}/json/"
  try:
    with urllib.request.urlopen(url, timeout=2.5) as response:
      payload = json.loads(response.read().decode("utf-8"))
    lat = payload.get("latitude"); lng = payload.get("longitude")
    country = (payload.get("country_name") or payload.get("country") or "Unknown")
    if lat is None or lng is None: location = _fallback_location(ip)
    else: location = {"lat": float(lat), "lng": float(lng), "country": country}
  except Exception: location = _fallback_location(ip)
  geo_cache[ip] = location
  return location

def generate_attack() -> dict:
  ip = faker_instance.ipv4_public()
  attack_type = random.choice(["sql_injection", "brute_force", "port_scan"])
  
  # Track for prediction
  recent_types.append(attack_type)
  if len(recent_types) > 20: recent_types.pop(0)

  if attack_type == "sql_injection": payload = random.choice(SQL_PAYLOADS)
  elif attack_type == "brute_force": payload = random.choice(BRUTE_PAYLOADS)
  else: payload = random.choice(PORT_SCAN_PAYLOADS)
  
  location = get_location(ip)
  return {
      "ip": ip,
      "attack_type": attack_type,
      "type": "SQL Injection" if attack_type == "sql_injection" else ("Brute Force" if attack_type == "brute_force" else "Port Scan"),
      "payload": payload,
      "timestamp": datetime.utcnow().isoformat(),
      "lat": location["lat"], "lng": location["lng"], "country": location["country"]
  }

def calculate_risk(ip: str, detection: dict) -> dict:
    """Advanced Dynamic Risk Scoring"""
    ip_score = min(100, ip_attempt_count.get(ip, 0) * 15)
    event_score = detection["confidence"]
    
    # Overall score weighted average
    total_avg = (ip_score * 0.4) + (event_score * 0.6)
    
    label = "SAFE" if total_avg < 40 else ("SUSPICIOUS" if total_avg < 75 else "DANGEROUS")
    color = "emerald" if total_avg < 40 else ("yellow" if total_avg < 75 else "pink")
    
    return {"score": int(total_avg), "label": label, "color": color, "ip_risk": ip_score}

def get_prediction() -> dict:
    """Predictive Threat Indicator"""
    if not recent_types: return {"type": "Scanning", "probability": 10}
    counts = Counter(recent_types)
    most_common = counts.most_common(1)[0]
    prob = int((most_common[1] / len(recent_types)) * 100)
    
    name_map = {"sql_injection": "SQL Injection", "brute_force": "Brute Force", "port_scan": "Network Scan"}
    return {"type": name_map.get(most_common[0], "Unknown"), "probability": min(95, prob + random.randint(5, 15))}

def profile_attacker(ip: str, attack_type: str):
    """Attacker Profiling System"""
    if ip not in attacker_profiles:
        attacker_profiles[ip] = {"type": "New Neutral", "behavior": [], "score": 0}
    
    profile = attacker_profiles[ip]
    profile["behavior"].append(attack_type)
    counts = Counter(profile["behavior"])
    
    if counts["brute_force"] > 3: profile["type"] = "Brute Force Bot"
    elif counts["sql_injection"] > 2: profile["type"] = "SQL Injector"
    elif counts["port_scan"] > 2: profile["type"] = "Network Scanner"
    elif len(profile["behavior"]) > 5: profile["type"] = "Persistent Threat"
    
    return profile

def detect_threat(log: dict) -> dict:
  ip = log["ip"]
  ip_attempt_count[ip] = ip_attempt_count.get(ip, 0) + 1
  count = ip_attempt_count[ip]
  
  # Explainable AI logic
  explanation = ""
  threat = False
  conf = 10
  priority = "LOW"
  
  SQL_PATTERNS = ["SELECT","UNION","DROP","OR '1","OR 1=","--",";","SLEEP","EXCEPT","INSERT","EXEC"]
  for pattern in SQL_PATTERNS:
    if pattern.lower() in log["event"].lower():
      threat = True
      conf = 92
      explanation = f"Heuristic match confirmed: Pattern '{pattern}' is commonly used to bypass authentication or dump database schemas."
      priority = "CRITICAL"
      break
      
  if not threat and log.get("attack_type") == "port_scan":
    threat = True
    conf = 84
    explanation = f"Multipoint scan detected from {ip}. Adversary is probing for open ports (21, 22, 80) to identify services for targeted exploit."
    priority = "HIGH"
    
  if not threat and count > 5:
    threat = True
    conf = 88
    explanation = f"Temporal frequency violation. {count} auth attempts in 30s exceeds safety threshold. High-confidence Brute-Force indicators."
    priority = "HIGH"

  if not threat:
    explanation = "Traffic profile aligns with baseline user behavior. No non-standard patterns observed."

  risk = calculate_risk(ip, {"threat": threat, "confidence": conf})
  profile = profile_attacker(ip, log.get("attack_type", "none"))
  
  # GAME RECO LOGIC
  reco = "IGNORE"
  if threat:
      reco = "BLOCK" if conf >= 85 else "RATE_LIMIT"

  return {
    "threat": threat,
    "confidence": conf,
    "reason": explanation if threat else "Baseline traffic",
    "explanation": explanation,
    "risk": risk,
    "profile": profile,
    "priority": priority if threat else "LOW",
    "recommended_action": reco
  }

def respond(detection: dict, log: dict) -> dict:
  global user_score
  ip = log["ip"]
  
  if not detection["threat"]:
    user_score += 5 # Reward for keeping system clean
    return {"action":"alert","message":f"Event logged from {ip}. Normal traffic.","status":"executed", "score": user_score}
    
  # Gamified response
  if detection["confidence"] >= 85:
    blocked_ips.add(ip)
    user_score += 20 # High reward for blocking threat
    return {"action":"block_ip","message":f"IP {ip} neutralized. {detection['priority']} threat blocked.","status":"executed", "score": user_score}
    
  user_score += 10 # Reward for detection
  return {"action":"rate_limit","message":f"Mitigation active for {ip}. Score updated.","status":"executed", "score": user_score}

def get_gamified_stats():
    badges = []
    if user_score > 1200: badges.append("Threat Hunter")
    if user_score > 1500: badges.append("Firewall Master")
    if user_score > 2000: badges.append("Rapid Responder")
    return {"score": user_score, "badges": badges}
