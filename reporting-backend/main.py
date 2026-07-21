import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import routers
from app.routes import (
    dashboard,
    upload,
    voice,
    csat,
    omnix,
    cleanup,
    report,          # ✅ Router report ditambahkan
    auth,            # ✅ Router auth ditambahkan
)

# Principal Report
from app.routes.principal import router as principal_router

# Load environment variables
load_dotenv()

app = FastAPI(
    title="SAISOKU OMNIX Backend",
    version="1.0.0",
)

# ============================================================
# CORS
# ============================================================
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "PUT", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "X-Admin-Token", "Authorization"],
)

# ============================================================
# REGISTER ROUTERS
# ============================================================

app.include_router(dashboard.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(csat.router, prefix="/api")
app.include_router(omnix.router, prefix="/api")
app.include_router(cleanup.router, prefix="/api")
app.include_router(report.router, prefix="/api")      # ✅ Router report diinclude
app.include_router(principal_router, prefix="/api")
app.include_router(auth.router, prefix="/api")         # ✅ Router auth diinclude

# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "status": "backend ready",
        "service": "SAISOKU OMNIX Backend",
        "version": "1.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "SAISOKU OMNIX Backend",
    }
