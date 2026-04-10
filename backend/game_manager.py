import asyncio
import random
import time
from typing import Dict, List, Any
import engine

class GameManager:
    def __init__(self):
        self.rooms: Dict[str, Dict[str, Any]] = {}
        self.boss_wave_active = False

    async def create_or_join_room(self, room_id: str, player_id: str):
        if room_id not in self.rooms:
            self.rooms[room_id] = {
                "players": {},
                "current_attack": None,
                "history": [],
                "start_time": time.time(),
                "boss_wave": False
            }
        
        if len(self.rooms[room_id]["players"]) < 2:
            self.rooms[room_id]["players"][player_id] = {
                "score": 0,
                "accuracy": 100,
                "streak": 0,
                "combo": 1,
                "total_attempts": 0,
                "correct_attempts": 0
            }
            return True
        return False

    def process_action(self, room_id: str, player_id: str, action: str, attack_id: str):
        room = self.rooms.get(room_id)
        if not room or not room["current_attack"] or room["current_attack"]["log"]["log_id"] != attack_id:
            return None

        player = room["players"].get(player_id)
        if not player:
            return None

        correct_action = room["current_attack"]["detection"]["recommended_action"]
        is_correct = action == correct_action
        
        # Scoring logic
        points = 0
        if is_correct:
            player["correct_attempts"] += 1
            player["streak"] += 1
            player["combo"] = (player["streak"] // 3) + 1
            points = 10 * player["combo"]
            
            # Speed bonus (if within 2s)
            elapsed = time.time() - room["current_attack"]["timestamp_start"]
            if elapsed < 2.0:
                points += 5
        else:
            player["streak"] = 0
            player["combo"] = 1
            points = -5

        player["total_attempts"] += 1
        player["score"] = max(0, player["score"] + points)
        player["accuracy"] = (player["correct_attempts"] / player["total_attempts"]) * 100

        return {
            "player_id": player_id,
            "is_correct": is_correct,
            "points": points,
            "new_score": player["score"],
            "streak": player["streak"],
            "combo": player["combo"],
            "accuracy": player["accuracy"]
        }

    async def run_boss_wave(self, room_id: str, broadcast_callback):
        room = self.rooms.get(room_id)
        if not room or room["boss_wave"]:
            return

        room["boss_wave"] = True
        await broadcast_callback({"type": "BOSS_WAVE_START", "message": "⚠️ DDoS WAVE DETECTED"})
        
        for _ in range(random.randint(10, 15)):
            attack = engine.generate_attack()
            log = engine.generate_log(attack)
            detection = engine.detect_threat(log)
            
            room["current_attack"] = {
                "attack": attack,
                "log": log,
                "detection": detection,
                "timestamp_start": time.time()
            }
            
            await broadcast_callback({"type": "ATTACK", "data": room["current_attack"]})
            await asyncio.sleep(0.8) # Rapid fire
            
        room["boss_wave"] = False
        await broadcast_callback({"type": "BOSS_WAVE_END", "message": "Wave Neutralized"})

game_manager = GameManager()
