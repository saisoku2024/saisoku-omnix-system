from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import routers dengan penamaan yang selaras
from app.routes import (
    dashboard,
    upload,
    voice,
    csat,
    omnix  # Pastikan file omnix.py sudah ada di folder routes
)

# Load environment variables
load_dotenv()

app = FastAPI(
    title="SAISOKU OMNIX Backend",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3002",
        "http://127.0.0.1:8001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers menggunakan objek .router dari tiap modul
app.include_router(dashboard.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(voice.router, prefix="/api")
app.include_router(csat.router, prefix="/api")
app.include_router(omnix.router, prefix="/api") # Tambahkan ini

# Root endpoint
@app.get("/")
def root():
    return {
        "status": "backend ready",
        "service": "SAISOKU OMNIX Backend",
        "version": "1.0.0"
    }