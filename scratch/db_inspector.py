import sqlite3
import pandas as pd
import os

DB_PATH = "backend/war_room.db"

def inspect_db():
    if not os.path.exists(DB_PATH):
        print(f"ERROR: Database file not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    
    # 1. Show Tables
    print("\n--- [ TACTICAL TABLES ] ---")
    tables = pd.read_sql_query("SELECT name FROM sqlite_master WHERE type='table';", conn)
    print(tables)

    # 2. Show recent activity
    print("\n--- [ RECENT USER ACTIONS (Audit Log) ] ---")
    try:
        activity = pd.read_sql_query("SELECT username, action, details, timestamp FROM user_activity ORDER BY id DESC LIMIT 10;", conn)
        print(activity)
    except:
        print("No user_activity table found or empty.")

    # 3. Show recent attack logs
    print("\n--- [ RECENT ATTACK VECTORS ] ---")
    try:
        attacks = pd.read_sql_query("SELECT ip, event, attack_type, timestamp FROM attack_logs ORDER BY id DESC LIMIT 5;", conn)
        print(attacks)
    except:
        print("No attack_logs table found or empty.")

    conn.close()

if __name__ == "__main__":
    inspect_db()
