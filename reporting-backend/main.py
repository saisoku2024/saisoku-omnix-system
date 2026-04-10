from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes.dashboard import router as dashboard_router
from app.routes.upload import router as upload_router
from app.routes.voice import router as voice_router
from app.routes.csat import router as csat_router

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
"http://127.0.0.1:3002",
],
allow_credentials=True,
allow_methods=["*"],
allow_headers=["*"],
)

# Register routers

app.include_router(dashboard_router, prefix="/api")
app.include_router(upload_router, prefix="/api")
app.include_router(voice_router, prefix="/api")
app.include_router(csat_router, prefix="/api")

# Root endpoint

@app.get("/")
def root():
	return {
		"status": "backend ready",
		"service": "SAISOKU OMNIX Backend"
	}