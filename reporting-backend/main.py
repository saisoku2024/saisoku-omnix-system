from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routes.dashboard import router as dashboard_router
from app.routes.upload import router as upload_router

load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002", "http://127.0.0.1:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(dashboard_router, prefix="/api")
app.include_router(upload_router, prefix="/api")


@app.get("/")
def root():
    return {"status": "backend ready"}