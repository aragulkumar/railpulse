from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserRegisterRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str
    preferred_language: Optional[str] = "en"


class UserLoginRequest(BaseModel):
    phone_or_email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    name: str
    phone: str
    email: Optional[str]
    preferred_language: str


class UserOut(BaseModel):
    id: int
    name: str
    phone: str
    email: Optional[str]
    preferred_language: str
    created_at: datetime

    class Config:
        from_attributes = True
