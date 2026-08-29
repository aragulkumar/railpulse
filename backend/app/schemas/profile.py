from pydantic import BaseModel
from typing import Optional, List
from app.schemas.auth import UserOut
from app.schemas.pnr import PNROut if False else BaseModel


class ProfileLanguageUpdate(BaseModel):
    preferred_language: str  # en, hi, ta, te, bn, mr, etc.


class ProfileDetails(BaseModel):
    user: UserOut
    total_trips: int
    active_trips: int
    total_complaints: int
