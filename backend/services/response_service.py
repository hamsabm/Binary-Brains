from typing import List, Set

blocked_ips: Set[str] = set()
rate_limited_ips: Set[str] = set()

def determine_response(ip: str, confidence_score: float):
    if confidence_score > 85:
        blocked_ips.add(ip)
        return "BLOCK", "SUCCESS"
    elif confidence_score >= 50:
        rate_limited_ips.add(ip)
        return "RATE LIMIT", "SUCCESS"
    else:
        return "FLAG", "SUCCESS"

def get_security_state():
    return {
        "blocked_ips": list(blocked_ips),
        "rate_limited_ips": list(rate_limited_ips)
    }

def reset_response_state():
    global blocked_ips, rate_limited_ips
    blocked_ips = set()
    rate_limited_ips = set()
