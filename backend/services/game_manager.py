import asyncio
import random
import time
import uuid
from typing import Dict, List, Any
import engine

class GameManager:
    def __init__(self):
        self.rooms: Dict[str, Dict[str, Any]] = {}
        self.online_users: Dict[str, Dict[str, Any]] = {} # id -> {username, status}
        self.matchmaking_queue: List[str] = [] # List of player IDs

    async def create_or_join_room(self, room_id: str, player_id: str, mode: str = "duel"):
        if room_id not in self.rooms:
            self.rooms[room_id] = {
                "mode": mode,
                "players": {},
                "current_attack": None,
                "history": [],
                "start_time": time.time(),
                "game_over": False,
                "timer": 120,
                "roles": {},
            }
        
        room = self.rooms[room_id]
        if player_id not in room["players"] and len(room["players"]) < 2:
            room["players"][player_id] = {
                "score": 0,
                "accuracy": 100,
                "streak": 0,
                "combo": 1,
                "total_attempts": 0,
                "correct_attempts": 0,
            }
            
            if mode == "duel":
                room["roles"][player_id] = "attacker" if not room["roles"] else "defender"
            
            return True
        return player_id in room["players"]

    def launch_manual_attack(self, room_id: str, attacker_id: str, attack_type: str):
        room = self.rooms.get(room_id)
        if not room or room["mode"] != "duel" or room["roles"].get(attacker_id) != "attacker":
            return None

        attack = engine.generate_attack()
        type_map = {
            "SQL Injection": "sql_injection",
            "Brute Force": "brute_force",
            "Port Scan": "port_scan",
            "DDoS": "ddos"
        }
        internal_type = type_map.get(attack_type, "sql_injection")
        attack["attack_type"] = internal_type
        attack["type"] = attack_type
        
        log = engine.generate_log(attack)
        detection = engine.detect_threat(log)
        
        # Educational Context
        learning_tips = {
            "SQL Injection": "Injecting malicious SQL queries to bypass security or leak data. Fix: Use Prepared Statements.",
            "Brute Force": "Systematic password guessing using dictionary attacks. Fix: Account Lockout & MFA.",
            "Port Scan": "Scanning a node to find open ports and services. Fix: Firewall ingress filtering.",
            "DDoS": "Overwhelming a service with massive traffic volume. Fix: CDN, Rate Limiting, WAF."
        }

        room["current_attack"] = {
            "attack": attack,
            "log": log,
            "detection": detection,
            "timestamp_start": time.time(),
            "learning": {
                "concept": attack_type,
                "description": learning_tips.get(attack_type, "Abnormal network pattern detected."),
                "mitigation": detection["recommended_action"]
            }
        }
        return room["current_attack"]

    def process_duel_action(self, room_id: str, defender_id: str, action: str, attack_id: str):
        room = self.rooms.get(room_id)
        if not room or room["roles"].get(defender_id) != "defender": return None
        if not room["current_attack"] or room["current_attack"]["log"]["log_id"] != attack_id: return None

        correct_action = room["current_attack"]["detection"]["recommended_action"]
        is_correct = action == correct_action
        
        defender = room["players"][defender_id]
        attacker_id = [pid for pid, role in room["roles"].items() if role == "attacker"][0]
        attacker = room["players"][attacker_id]
        
        points = 0
        speed_bonus = 0
        elapsed = time.time() - room["current_attack"]["timestamp_start"]
        
        if is_correct:
            points = 10
            if elapsed < 2.0: speed_bonus = 5
            defender["score"] += (points + speed_bonus)
            defender["correct_attempts"] += 1
        else:
            attacker["score"] += 10
        
        defender["total_attempts"] += 1
        room["current_attack"] = None
        
        return {
            "is_correct": is_correct, "points": points + speed_bonus,
            "defender_id": defender_id, "attacker_id": attacker_id,
            "new_scores": {defender_id: defender["score"], attacker_id: attacker["score"]}
        }

    async def run_game_loop(self, room_id: str, broadcast_callback):
        room = self.rooms.get(room_id)
        if not room: return
        
        start_ts = time.time()
        while time.time() - start_ts < room["timer"]:
            if room_id not in self.rooms: break
            remaining = int(room["timer"] - (time.time() - start_ts))
            await broadcast_callback({
                "type": "TICK",
                "data": {
                    "time_remaining": remaining,
                    "scores": {pid: p["score"] for pid, p in room["players"].items()}
                }
            })
            await asyncio.sleep(1)
            
        if room_id in self.rooms:
            await broadcast_callback({"type": "GAME_OVER", "data": "Combat Phase Complete"})
            scores = {pid: p["score"] for pid, p in room["players"].items()}
            winner = max(scores, key=scores.get) if scores else "None"
            await broadcast_callback({"type": "RESULT", "winner": winner})

game_manager = GameManager()
