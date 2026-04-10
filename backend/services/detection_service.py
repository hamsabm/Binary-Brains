from typing import Dict

# Simple in-memory storage for brute force tracking (per simulation run)
login_attempts: Dict[str, int] = {}

def detect_threat(attack_data: dict):
    payload = attack_data["payload"].upper()
    attack_type = attack_data["attack_type"]
    ip = attack_data["source_ip"]
    
    threat_type = "None"
    confidence_score = 0.0
    reason = "Normal activity detected."
    
    # SQL Injection Detection
    sql_keywords = ["SELECT", "UNION", "OR 1=1", "DROP", "--"]
    if any(keyword in payload for keyword in sql_keywords):
        threat_type = "SQL Injection"
        confidence_score = 95.0
        reason = f"Malicious SQL pattern found in payload: {attack_data['payload']}"
        return threat_type, confidence_score, reason

    # XSS Detection
    if "<SCRIPT>" in payload or "ONERROR=" in payload or "JAVASCRIPT:" in payload:
        threat_type = "XSS"
        confidence_score = 90.0
        reason = "Potential Cross-Site Scripting attack detected via script tags or event handlers."
        return threat_type, confidence_score, reason

    # Brute Force Detection
    if "LOGIN_ATTEMPT" in payload:
        login_attempts[ip] = login_attempts.get(ip, 0) + 1
        if login_attempts[ip] > 3:
            threat_type = "Brute Force"
            confidence_score = 88.0
            reason = f"Multiple failed login attempts ({login_attempts[ip]}) detected from single IP."
            return threat_type, confidence_score, reason
        else:
            threat_type = "Suspicious Activity"
            confidence_score = 45.0
            reason = "Initial failed login attempt detected."
            return threat_type, confidence_score, reason

    return threat_type, confidence_score, reason

def reset_detection_state():
    global login_attempts
    login_attempts = {}
