from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import routers
from app.routes import (
    dashboard,
    upload,
    voice,
    csat,
    omnix
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
# Sementara dibuka penuh untuk debugging.
# Setelah semua page stabil, bisa diperketat lagi.
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# REGISTER ROUTERS
# ============================================================

app.include_router(dashboard.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(csat.router, prefix="/api")
app.include_router(omnix.router, prefix="/api")

# Principal Report
app.include_router(principal_router, prefix="/api")

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