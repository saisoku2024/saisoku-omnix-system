import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Deteksi folder script ini berada
current_dir = Path(__file__).parent
env_path = current_dir / ".env"

load_dotenv(dotenv_path=env_path)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

print(f"--- Environment Check ---")
print(f"Looking for .env in: {env_path}")
print(f"URL: {'OK' if url else 'MISSING'}")
print(f"KEY: {'OK' if key else 'MISSING'}")
print(f"-------------------------\n")

if not url or not key:
    exit()

supabase: Client = create_client(url, key)

def check_table(table_name):
    try:
        res = supabase.table(table_name).select("id").limit(1).execute()
        print(f"✅ {table_name}: Connection Success (Data: {len(res.data)} row)")
    except Exception as e:
        print(f"❌ {table_name}: Error -> {e}")

if __name__ == "__main__":
    tables = ["voice_interactions", "omnix_cases", "csat_responses"]
    for t in tables:
        check_table(t)