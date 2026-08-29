from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class ChatMessageRequest(BaseModel):
    session_id: Optional[str] = None
    text: str
    language: Optional[str] = "en"


class ChatMessageResponse(BaseModel):
    session_id: str
    reply_text: str
    language: str
    action_type: Optional[str] = None  # eta_card, pnr_card, complaint_card, booking_card
    action_data: Optional[Dict[str, Any]] = None
    suggested_quick_replies: Optional[List[str]] = []
