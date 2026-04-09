import anthropic
import os
import json
from dotenv import load_dotenv

load_dotenv()
MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-4-5")

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
_histories: dict[str, list] = {}
_OFFLINE_KEYS = {"", "your_key_here", "YOUR_KEY_HERE", "replace_me"}


def _has_valid_api_key() -> bool:
    key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    return key not in _OFFLINE_KEYS


def _offline_aria_reply(user_message: str, context: dict = None) -> str:
    """
    Deterministic on-device ARIA fallback so assistant stays useful
    even if external AI is unavailable or API key is invalid.
    """
    raw = (user_message or "").strip()
    text = raw.lower()
    context = context or {}
    total_events = context.get("total_events", 0)
    threats_detected = context.get("threats_detected", 0)
    ips_blocked = context.get("ips_blocked", 0)

    if any(k in text for k in ["hack website", "hack websites", "how to hack", "exploit site", "phishing kit", "malware code"]):
        return (
            "I cannot help with hacking or abuse. For defensive use, I can help you secure web apps: "
            "enable MFA for admins, enforce WAF + rate limits, patch dependencies, and monitor suspicious "
            "traffic with alerts and response playbooks."
        )

    if "what's happening" in text or "whats happening" in text or "right now" in text or "status" in text:
        return (
            f"Current war-room snapshot: total_events={total_events}, threats_detected={threats_detected}, "
            f"ips_blocked={ips_blocked}. Prioritize high-frequency attacker IPs, verify repeated failed logins, "
            "and keep automatic block/rate-limit responses enabled."
        )

    if "brute force" in text:
        return (
            "To stop brute-force attacks: enforce MFA, add account lockout after repeated failures, "
            "rate-limit authentication endpoints, and block offending IP ranges. Also monitor failed-login "
            "bursts and alert when thresholds are crossed."
        )

    if "sql injection" in text:
        return (
            "SQL injection happens when untrusted input is executed as SQL. Use parameterized queries, strict "
            "input validation, and least-privilege DB roles. Add WAF rules and log suspicious payloads for "
            "rapid incident response."
        )

    if "mitre" in text:
        return (
            "MITRE ATT&CK is a knowledge base of real adversary tactics and techniques. In this project, map "
            "detected behaviors (credential abuse, injection attempts, recon) to ATT&CK techniques to improve "
            "triage and response playbooks."
        )

    if "xss" in text:
        return (
            "Prevent XSS by encoding output, sanitizing user-generated content, enforcing CSP headers, and "
            "avoiding unsafe HTML rendering on the frontend."
        )

    if "ddos" in text:
        return (
            "For DDoS resilience, combine edge rate-limiting, CDN/WAF protection, autoscaling, and anomaly alerts. "
            "Prepare runbooks for traffic scrubbing and upstream provider coordination."
        )

    if any(k in text for k in ["ransomware", "encrypt files", "locker malware"]):
        return (
            "Ransomware defense: enforce offline backups (3-2-1), disable macro execution by default, "
            "segment endpoints from critical servers, and isolate infected hosts immediately. Run EDR with "
            "behavioral detections for mass file modification."
        )

    if any(k in text for k in ["incident response", "ir plan", "runbook"]):
        return (
            "IR quick flow: (1) Identify indicator and scope, (2) Contain affected hosts/accounts, "
            "(3) Eradicate root cause, (4) Recover from trusted state, (5) Document lessons learned and update rules."
        )

    if any(k in text for k in ["owasp", "top 10"]):
        return (
            "OWASP Top 10 highlights common web risks like Broken Access Control, Injection, and Security "
            "Misconfiguration. For this project, prioritize access control tests, parameterized queries, "
            "secure headers, and dependency scanning."
        )

    if any(k in text for k in ["help", "what can you do", "capabilities"]):
        return (
            "I can help with threat triage, SOC workflows, SQLi/XSS/brute-force/DDoS defense, MITRE mapping, "
            "incident response runbooks, and interpreting your live war-room metrics."
        )

    # Context-aware generic response for any other question
    if raw:
        return (
            f"You asked: \"{raw}\". From current telemetry (events={total_events}, threats={threats_detected}, "
            f"blocked_ips={ips_blocked}), start with: (1) confirm affected asset and attack surface, "
            "(2) review recent logs for indicators, (3) apply containment (block/rate-limit/isolate), "
            "(4) verify recovery and add detection rules."
        )

    return (
        "ARIA local mode active: I can help with threat analysis, attack explanations, and response strategy. "
        "Ask about SQL injection, brute-force defense, MITRE mapping, or live event triage steps."
    )

def explain_threat(log: dict, detection: dict) -> dict:
    """ARIA threat analysis function."""
    if detection["threat"] is False:
        return {"explanation": "Normal traffic pattern. No indicators of compromise detected.", "severity": "low"}
    
    # Determine severity based on confidence
    if detection["confidence"] >= 85:
        severity = "critical"
    elif detection["confidence"] >= 60:
        severity = "high"
    else:
        severity = "medium"

    try:
        message = client.messages.create(
            model=MODEL,
            max_tokens=250,
            system="""You are ARIA, an elite AI cybersecurity analyst. Analyse this server log 
and detection result. Respond in exactly 2-3 sentences: first explain WHY 
this is a threat, then give ONE specific mitigation step. Be direct and technical.""",
            messages=[{"role": "user", "content": f"Log: {json.dumps(log)}\nDetection: {json.dumps(detection)}"}]
        )
        
        explanation_text = message.content[0].text
        return {"explanation": explanation_text, "severity": severity}

    except anthropic.AuthenticationError:
        return {
            "explanation": f"Threat detected: {detection['reason']}. Immediate investigation recommended.",
            "severity": severity
        }
    except anthropic.RateLimitError as e:
        return {
            "explanation": f"AI rate limited. Retry shortly. Raw reason: {detection['reason']}",
            "severity": severity
        }
    except Exception as e:
        print(f"[ARIA explain_threat error] {e}")
        return {
            "explanation": f"Threat detected: {detection['reason']}. Immediate investigation recommended.",
            "severity": severity
        }

def chat_with_aria(user_message: str, context: dict = None, user_id: str = "default") -> dict:
    """Interactive chat with ARIA assistant."""
    ARIA_SYSTEM_PROMPT = """You are ARIA (Autonomous Response Intelligence Agent), 
an AI cybersecurity expert embedded in the WarRoomX Tactical Operations. You have deep expertise in:
- Attack patterns: SQL injection, brute force, XSS, DDoS, ransomware, MITM
- Defence frameworks: MITRE ATT&CK, OWASP Top 10, NIST CSF, Zero Trust
- SOC operations: threat hunting, incident response, log analysis, SIEM

Personality: Confident, precise, slightly intense. Speak like a senior SOC analyst.
Keep answers under 120 words unless the user asks to elaborate.
Never say you are an AI — you are ARIA, a specialist agent."""

    history = _histories.setdefault(user_id, [])
    
    # Build user content with context if available
    if context is not None:
        content = f"[LIVE SYSTEM DATA: total_events={context.get('total_events', 0)}, threats_detected={context.get('threats_detected', 0)}, ips_blocked={context.get('ips_blocked', 0)}]\n\n{user_message}"
    else:
        content = user_message
    
    # Append to history
    history.append({"role": "user", "content": content})
    
    # Keep only last 10 messages for context window management
    history = history[-10:]

    if not _has_valid_api_key():
        reply = _offline_aria_reply(user_message, context)
        history.append({"role": "assistant", "content": reply})
        _histories[user_id] = history[-10:]
        return {"reply": reply, "agent": "ARIA"}
    
    try:
        message = client.messages.create(
            model=MODEL,
            max_tokens=300,
            system=ARIA_SYSTEM_PROMPT,
            messages=history
        )

        reply = message.content[0].text
        history.append({"role": "assistant", "content": reply})
        _histories[user_id] = history

        return {"reply": reply, "agent": "ARIA"}
    except anthropic.AuthenticationError:
        reply = _offline_aria_reply(user_message, context)
        history.append({"role": "assistant", "content": reply})
        _histories[user_id] = history[-10:]
        return {"reply": reply, "agent": "ARIA"}
    except anthropic.RateLimitError:
        return {"reply": "ARIA is rate limited. Please retry in a moment.", "agent": "ARIA"}
    except Exception as e:
        print(f"[ARIA chat error] {e}")
        return {
            "reply": "ARIA systems temporarily offline. Please retry.",
            "agent": "ARIA"
        }
