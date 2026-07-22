import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "SAISOKU OMNIX Backend"
    VERSION: str = "1.0.0"

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_ANON_KEY: str = ""

    ADMIN_API_TOKEN: str = ""
    ADMIN_USERNAME: str = ""
    ADMIN_PASSWORD: str = ""
    JWT_SECRET_KEY: str = ""

    ALLOWED_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000,https://saisoku-omnix-system.vercel.app"
    )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
