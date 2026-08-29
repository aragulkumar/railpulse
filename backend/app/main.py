from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.session import engine, Base
import app.models  # Ensure all models are registered
from app.routers import eta, auth, booking, complaints, chatbot, notifications, profile
from app.db.seed import seed_database

# Create database tables automatically
Base.metadata.create_all(bind=engine)
# Seed initial data on startup if clean
try:
    seed_database()
except Exception as e:
    print(f"Seed note: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="RailPulse — Dynamic ETA + Passenger Services Monolith Platform (SIH 2026 Prototype)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router)
app.include_router(eta.router, prefix="/eta")
app.include_router(eta.router, prefix="")  # For direct /ws/eta WebSocket mounting
app.include_router(booking.router)
app.include_router(complaints.router)
app.include_router(chatbot.router)
app.include_router(notifications.router)
app.include_router(profile.router)


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
