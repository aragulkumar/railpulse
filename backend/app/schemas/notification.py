from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class NotificationOut(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    body: str
    deep_link: Optional[str]
    is_read: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
