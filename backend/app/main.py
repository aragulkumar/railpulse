from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import engine, Base
import app.models  # Ensure all models are registered

# Create database tables automatically on startup if SQLite or PG without migration
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="RailPulse — Dynamic ETA + Passenger Services Monolith Platform (SIH 2026 Prototype)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for React Native / Web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "app": "RailPulse API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "tagline": "Dynamic ETA + Passenger Services Platform"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "connected"}
