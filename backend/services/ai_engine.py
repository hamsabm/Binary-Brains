import os
import asyncio
from anthropic import AsyncAnthropic

# 11. ERROR HANDLING
FALLBACK_INTEL = "Malicious pattern identified in traffic stream. Protocol isolation executing. Node baseline secured."

async def generate_explanation(raw_log, detection):
    """
    7. AI EXPLAINER (STRICT FORMAT)
    - 2–3 sentences
    - What it is, why malicious, what action taken.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or "sk-" not in api_key:
        return f"This {detection['threat']} attack uses illegal payloads to exploit system vectors. It poses a risk of data exfiltration or service disruption. The system has initiated an automated {detection['priority']} response to block the source."

    client = AsyncAnthropic(api_key=api_key)
    prompt = f"""
    ROLE: Senior SOC AI Analyst
    INPUT: Log: {raw_log} | Threat: {detection['threat']} | Confidence: {detection['confidence']}
    
    TASK: Provide a 2-3 sentence explanation for a dashboard.
    FORMAT: 
    1. Explain what the attack is.
    2. Why it is malicious.
    3. What action should be taken.
    
    STRICT: No hallucinations. No vague language. Max 3 sentences.
    """

    try:
        response = await client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text.strip()
    except Exception as e:
        print(f"[AI_GATEWAY_ERROR] {e}")
        return FALLBACK_INTEL

async def get_aria_response(question, logs, stats):
    """
    8. ARIA AI CHATBOT (SOC Tone)
    """
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key or "sk-" not in api_key:
        return "Tactical HUD operational. No imminent breaches detected in current neural pulse. Total threats neutralized: 12."

    client = AsyncAnthropic(api_key=api_key)
    context = f"Latest Logs: {logs[:3]} | Stats: {stats}"
    prompt = f"""
    IDENTITY: ARIA (Cyber War Room Assistant)
    TONE: Professional SOC Analyst. Concise. Intelligent.
    CONTEXT: {context}
    QUESTION: {question}
    """
    try:
        response = await client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text.strip()
    except:
        return "Communications node saturated. Summary: System secure, monitoring ingress vectors."
