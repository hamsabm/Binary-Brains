import asyncio
from models import database
from services import engine, ai_engine

connected_clients = set() # Global set for streaming

async def global_attack_generator():
    """Deterministic 3-second simulation loop. Passive by default."""
    while True:
        if database.simulation_active:
            try:
                # 3. ATTACK SIMULATION ENGINE
                attack = engine.generate_attack()
                
                # 4. LOG GENERATION
                log_entry = engine.generate_log(attack)
                
                # 5. DETECTION ENGINE (STRICT RULE-BASED)
                detection = engine.detect_threat(log_entry)
                
                # 6. RESPONSE ENGINE (AUTOMATED)
                response = engine.respond(detection, log_entry)
                
                # Persist to Ledger
                database.insert_log(log_entry)
                database.insert_detection(log_entry["log_id"], detection)
                database.insert_response(log_entry["log_id"], response)
                
                # 7. AI EXPLAINER (STRICT 2-3 SENTENCES)
                ai_intel = await ai_engine.generate_explanation(log_entry["raw_log"], detection)
                
                # Real-time Payload
                payload = {
                    "attack": attack,
                    "log": log_entry,
                    "detection": {**detection, "explanation": ai_intel},
                    "response": response,
                    "type": "STREAM_UPDATE"
                }

                # 9. REAL-TIME BROADCAST
                disconnected = set()
                for client in connected_clients:
                    try:
                        await client.send_json(payload)
                    except Exception:
                        disconnected.add(client)
                for c in disconnected: connected_clients.remove(c)

            except Exception as e:
                print(f"[TACTICAL_CORE_ERROR] {e}")
        
        # STRICT 3-SECOND CYCLE
        await asyncio.sleep(3.0)
