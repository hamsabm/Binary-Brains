import asyncio
import random
import time
import uuid
from typing import Dict, List, Any
import engine

class GameManager:
    def __init__(self):
        self.rooms: Dict[str, Dict[str, Any]] = {}

    async def create_or_join_room(self, room_id: str, player_id: str, mode: str = "coop"):
        """
        room_id: unique room identifier
        player_id: username or unique id
        mode: 'coop' (Human vs AI/Multiplayer Same Side) or 'duel' (Attacker vs Defender)
        """
        if room_id not in self.rooms:
            self.rooms[room_id] = {
                "mode": mode,
                "players": {},
                "current_attack": None,
                "history": [],
                "start_time": time.time(),
                "game_over": False,
                "timer": 120, # 2 minute default
                "roles": {}, # For duel mode: {player_id: 'attacker'|'defender'}
            }
        
        room = self.rooms[room_id]
        if len(room["players"]) < 2:
            room["players"][player_id] = {
                "score": 0,
                "accuracy": 100,
                "streak": 0,
                "combo": 1,
                "total_attempts": 0,
                "correct_attempts": 0,
            }
            
            # Role Assignment for Duel Mode
            if mode == "duel":
                if not room["roles"]:
                    room["roles"][player_id] = "attacker"
                else:
                    room["roles"][player_id] = "defender"
            
            return True
        return False

    def launch_manual_attack(self, room_id: str, attacker_id: str, attack_type: str):
        """Called when an attacker (Red Team) triggers an attack in Duel mode."""
        room = self.rooms.get(room_id)
        if not room or room["mode"] != "duel" or room["roles"].get(attacker_id) != "attacker":
            return None

        # Logic to generate specific attack
        attack = engine.generate_attack() # Core generation
        # Override with requested type
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
        
        room["current_attack"] = {
            "attack": attack,
            "log": log,
            "detection": detection,
            "timestamp_start": time.time()
        }
        return room["current_attack"]

    def process_duel_action(self, room_id: str, defender_id: str, action: str, attack_id: str):
        """Called when defender (Blue Team) initiates a block/mitigate."""
        room = self.rooms.get(room_id)
        if not room or room["mode"] != "duel" or room["roles"].get(defender_id) != "defender":
            return None
            
        if not room["current_attack"] or room["current_attack"]["log"]["log_id"] != attack_id:
            return None

        correct_action = room["current_attack"]["detection"]["recommended_action"]
        is_correct = action == correct_action
        
        # Scoring Logic for Duel
        # Defender gets points if correct. Attacker gets points if defender fails.
        defender = room["players"][defender_id]
        attacker_id = [pid for pid, role in room["roles"].items() if role == "attacker"][0]
        attacker = room["players"][attacker_id]
        
        points = 0
        speed_bonus = 0
        elapsed = time.time() - room["current_attack"]["timestamp_start"]
        
        if is_correct:
            points = 10
            if elapsed < 2.0:
                speed_bonus = 5
            defender["score"] += (points + speed_bonus)
            defender["correct_attempts"] += 1
        else:
            attacker["score"] += 10
        
        defender["total_attempts"] += 1
        room["current_attack"] = None # Attack resolved
        
        return {
            "is_correct": is_correct,
            "points": points + speed_bonus,
            "defender_id": defender_id,
            "attacker_id": attacker_id,
            "new_scores": {
                defender_id: defender["score"],
                attacker_id: attacker["score"]
            }
        }

    async def run_game_loop(self, room_id: str, broadcast_callback):
        """Main loop to sync timer and broadcast state updates."""
        room = self.rooms.get(room_id)
        if not room: return
        
        start_ts = time.time()
        while time.time() - start_ts < room["timer"]:
            if room_id not in self.rooms: break
            
            # Tick
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
            # Winner detection
            scores = {pid: p["score"] for pid, p in room["players"].items()}
            winner = max(scores, key=scores.get) if scores else "None"
            await broadcast_callback({"type": "RESULT", "winner": winner})
            # Cleanup later or keep for session replay

game_manager = GameManager()
