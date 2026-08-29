from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from app.schemas.auth import UserOut


class ProfileLanguageUpdate(BaseModel):
    preferred_language: str  # en, hi, ta, te, bn, mr, etc.


class ProfileDetails(BaseModel):
    user: UserOut
    total_trips: int
    active_trips: int
    total_complaints: int
    model_config = ConfigDict(from_attributes=True)
