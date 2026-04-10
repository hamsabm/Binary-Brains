import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_login(username, password):
    print(f"Testing login for: {username}...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password})
        if resp.status_code == 200:
            print(f"SUCCESS: {username} logged in! Status 200")
        else:
            print(f"FAILED: {username} - Status {resp.status_code} - Detail: {resp.json().get('detail')}")
    except Exception as e:
        print(f"ERROR connecting to backend: {e}")

if __name__ == "__main__":
    test_login("admin", "cyberwar123")
    test_login("analyst", "analyst123")
