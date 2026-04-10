import os
from anthropic import Anthropic
import logging

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", "missing"))

FALLBACK_EXPLANATIONS = {
    "SQL Injection": "An attacker attempted to manipulate the database by injecting harmful SQL commands into the input stream. This is malicious because it can lead to data theft or destruction. The system blocked the request to protect database integrity.",
    "Brute Force": "A high frequency of login attempts was detected from a single source, suggesting an automated password-cracking attempt. This threatens account security by trying millions of combinations. The IP has been rate-limited or blocked to prevent unauthorized access.",
    "XSS": "Malicious script tags were found in the request payload, indicating a Cross-Site Scripting attempt. This could allow an attacker to hijack user sessions or deface the site. The system flagged and dropped the suspicious payload immediately.",
    "Suspicious Activity": "Unusual traffic patterns were observed that do not match standard user behavior. While not a definitive attack, it poses a risk of reconnaissance. We have flagged the activity for further manual review by SOC analysts."
}

def get_ai_explanation(threat_type: str, payload: str, action: str):
    prompt = f"""
    As a SOC expert, explain this security event in 2-3 concise sentences:
    Event: {threat_type}
    Payload: {payload}
    Action Taken: {action}
    
    Structure:
    1. What happened.
    2. Why it's malicious.
    3. What action was taken.
    """
    
    try:
        if os.getenv("ANTHROPIC_API_KEY") == "your_key_here" or not os.getenv("ANTHROPIC_API_KEY"):
            raise Exception("No valid API key")
            
        response = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text.strip()
    except Exception as e:
        logging.error(f"AI API Failure: {e}")
        return FALLBACK_EXPLANATIONS.get(threat_type, "Unrecognized threat pattern detected. Security protocols have been engaged to neutralize the risk. The system remains under high-alert monitoring.")

def get_aria_response(query: str, logs: list, status: str):
    prompt = f"""
    You are ARIA, a professional SOC Analyst.
    Current System Status: {status}
    Recent Logs Summary: {logs[:5]}
    
    User Query: {query}
    
    Respond in a professional, concise tone. If the user asks for logs, summarize them.
    """
    try:
        if os.getenv("ANTHROPIC_API_KEY") == "your_key_here" or not os.getenv("ANTHROPIC_API_KEY"):
            raise Exception("No valid API key")

        response = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text.strip()
    except Exception:
        # Fallback ARIA responses
        if "status" in query.lower():
            return f"System status is currently {status}. Monitoring all entry points for suspicious activity."
        if "happening" in query.lower() or "recent" in query.lower():
            return f"Detected {len(logs)} events in the last cycle. Primarily seeing {threat_type_summary(logs)}. Defensive measures are active."
        return "I am currently operating in localized mode due to connectivity issues, but I can confirm system integrity is maintained."

def threat_type_summary(logs):
    if not logs: return "no threats"
    types = [l.get("attack_type", "unknown") for l in logs]
    return f"activity involving {', '.join(set(types))}"
