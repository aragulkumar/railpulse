from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt
import hashlib
from app.config import settings

# Robust SHA256 + salt password hashing (zero external C-library dependency issues on Windows)
SALT = "railpulse_salt_2026_secure"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password


def get_password_hash(password: str) -> str:
    return hashlib.sha256((password + SALT).encode("utf-8")).hexdigest()


def create_access_token(subject: Union[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
