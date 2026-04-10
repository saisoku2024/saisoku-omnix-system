import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Ambil env vars
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL & SUPABASE_ANON_KEY missing dari .env")

# Buat client dan EXPORT
supabase: Client = create_client(supabase_url, supabase_key)

__all__ = ["supabase"]