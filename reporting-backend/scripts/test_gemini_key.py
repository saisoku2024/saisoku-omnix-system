import os
import requests
import json
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

KEY = (os.getenv("GEMINI_API_KEYS") or os.getenv("GEMINI_API_KEY") or "").split(",")[0].strip()

print(f"Testing API Key against Google Generative Language API...")

# 1. List Available Models
models_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={KEY}"
try:
    resp = requests.get(models_url, timeout=10)
    print(f"List Models Status: {resp.status_code}")
    if resp.ok:
        models = [m.get("name") for m in resp.json().get("models", [])]
        print(f"Available Models ({len(models)}): {models[:5]}")
    else:
        print(f"List Models Error: {resp.text[:300]}")
except Exception as e:
    print(f"List Models Exception: {e}")

# 2. Test generateContent with gemini-2.0-flash
chat_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
try:
    resp = requests.post(
        chat_url,
        headers={"x-goog-api-key": KEY, "Content-Type": "application/json"},
        json={"contents": [{"parts": [{"text": "Halo, tes respon AI"}]}]},
        timeout=15
    )
    print(f"\nGenerate Content Status: {resp.status_code}")
    if resp.ok:
        print("Response Success!")
        print("Output:", resp.json()["candidates"][0]["content"]["parts"][0]["text"])
    else:
        print("Response Error:", resp.text[:300])
except Exception as e:
    print(f"Generate Content Exception: {e}")
