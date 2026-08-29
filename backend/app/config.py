import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "RailPulse"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "railpulse_secret_super_key_hackathon_2026_jwt_token_secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database: Supports SQLite for zero-config local run, or PostgreSQL / TimescaleDB
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./railpulse.db")
    
    # Redis for caching, pubsub and celery
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")

    # ML & Feature Flags
    ENABLE_XGBOOST: bool = True
    ENABLE_CELERY: bool = False
    
    # LLM Settings (optional API keys)
    ANTHROPIC_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
