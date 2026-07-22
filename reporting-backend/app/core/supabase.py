import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

missing_env = [
    name
    for name, value in {
        "SUPABASE_URL": supabase_url,
        "SUPABASE_SERVICE_ROLE_KEY": supabase_key,
    }.items()
    if not value
]

if missing_env:
    raise RuntimeError(
        "Missing required Supabase environment variables: "
        + ", ".join(missing_env)
    )

supabase: Client = create_client(supabase_url, supabase_key)

__all__ = ["supabase"]
