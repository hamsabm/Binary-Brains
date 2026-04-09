from faker import Faker
import random
import uuid
from datetime import datetime
import re
import json
import logging
import urllib.request
import urllib.parse

faker_instance = Faker()
logger = logging.getLogger(__name__)

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

ip_attempt_count = {}
blocked_ips = set()
geo_cache = {}


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
  # Using a seeded random selection from global cities to ensure high-fidelity 'real' land points
  # Even if the external Geolocation API is rate-limited.
  seeded = random.Random(abs(hash(ip)) % (2**32))
  city = seeded.choice(GLOBAL_CITIES)
  return {
      "lat": city["lat"] + seeded.uniform(-0.5, 0.5), # Add subtle variance
      "lng": city["lng"] + seeded.uniform(-0.5, 0.5),
      "country": "Simulated"
  }


def get_location(ip: str) -> dict:
  cached = geo_cache.get(ip)
  if cached:
    return cached

  url = f"https://ipapi.co/{urllib.parse.quote(ip)}/json/"
  try:
    with urllib.request.urlopen(url, timeout=2.5) as response:
      payload = json.loads(response.read().decode("utf-8"))

    lat = payload.get("latitude") if payload else None
    lng = payload.get("longitude") if payload else None
    country = (payload.get("country_name") or payload.get("country") or "Unknown") if payload else "Unknown"

    if lat is None or lng is None:
      location = _fallback_location(ip)
    else:
      location = {"lat": float(lat), "lng": float(lng), "country": country}
  except Exception as exc:
    logger.warning("geolocation lookup failed for ip=%s reason=%s", ip, exc)
    location = _fallback_location(ip)

  geo_cache[ip] = location
  return location

def generate_attack() -> dict:
  ip = faker_instance.ipv4_public()
  attack_type = random.choice(["sql_injection", "brute_force", "port_scan"])
  if attack_type == "sql_injection":
    payload = random.choice(SQL_PAYLOADS)
  elif attack_type == "brute_force":
    payload = random.choice(BRUTE_PAYLOADS)
  else:
    payload = random.choice(PORT_SCAN_PAYLOADS)
  location = get_location(ip)
  attack_event = {
      "ip": ip,
      "attack_type": attack_type,
      "type": "SQL Injection" if attack_type == "sql_injection" else ("Brute Force" if attack_type == "brute_force" else "Port Scan"),
      "payload": payload,
      "timestamp": datetime.utcnow().isoformat(),
      "lat": location["lat"],
      "lng": location["lng"],
      "country": location["country"]
  }
  print("Generated Attack:", {
      "ip": attack_event["ip"],
      "type": attack_event["type"],
      "timestamp": attack_event["timestamp"],
      "lat": attack_event["lat"],
      "lng": attack_event["lng"],
      "country": attack_event["country"]
  })
  return attack_event

def generate_log(attack: dict) -> dict:
  log_id = str(uuid.uuid4())
  if attack["attack_type"] == "sql_injection":
    event = f"GET /search?q={attack['payload']} HTTP/1.1 - 200"
  elif attack["attack_type"] == "brute_force":
    event = f"POST /api/login 401 Unauthorized user:{attack['payload']}"
  else:
    event = f"NETFLOW scan_detected src={attack['ip']} signature=\"{attack['payload']}\""
  status = random.choices(["failed","success"], weights=[80,20])[0]
  return {"log_id":log_id, "ip":attack["ip"], "event":event, "status":status, 
          "attack_type":attack["attack_type"], "timestamp":attack["timestamp"],
          "lat": attack.get("lat"), "lng": attack.get("lng"), "country": attack.get("country", "Unknown")}

def detect_threat(log: dict) -> dict:
  ip = log["ip"]
  ip_attempt_count[ip] = ip_attempt_count.get(ip, 0) + 1
  count = ip_attempt_count[ip]
  SQL_PATTERNS = ["SELECT","UNION","DROP","OR '1","OR 1=","--",";","SLEEP","EXISTS","INSERT","EXEC"]
  for pattern in SQL_PATTERNS:
    if pattern.lower() in log["event"].lower():
      return {"threat":True,"confidence":92,"reason":f"SQL injection pattern '{pattern}' detected in request"}
  if log.get("attack_type") == "port_scan":
    return {"threat":True,"confidence":84,"reason":"Port scanning behaviour detected: sequential probing across multiple ports"}
  if count > 5:
    return {"threat":True,"confidence":88,"reason":f"Brute force: {count} login attempts from {ip}"}
  if log["status"]=="success" and count >= 3:
    return {"threat":True,"confidence":75,"reason":f"Possible breach after {count} prior attempts from {ip}"}
  return {"threat":False,"confidence":10,"reason":"Normal traffic — no threat indicators"}

def respond(detection: dict, log: dict) -> dict:
  ip = log["ip"]
  if not detection["threat"]:
    return {"action":"alert","message":f"Event logged from {ip}. No threat detected.","status":"executed"}
  if detection["confidence"] >= 85:
    blocked_ips.add(ip)
    return {"action":"block_ip","message":f"IP {ip} permanently blocked. {detection['reason']}","status":"executed"}
  if detection["confidence"] >= 50:
    return {"action":"rate_limit","message":f"Rate limiting applied to {ip}. Monitoring escalated.","status":"executed"}
  return {"action":"alert","message":f"Low-confidence flag on {ip}. Analyst review recommended.","status":"executed"}
