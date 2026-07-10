import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError(
        "SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY missing dari .env"
    )

supabase: Client = create_client(supabase_url, supabase_key)

__all__ = ["supabase"]
