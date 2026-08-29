from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.deps import get_current_user_optional
from app.models.user import User
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.services.chatbot_service import chatbot_service

router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post("/message", response_model=ChatMessageResponse)
def send_chat_message(
    req: ChatMessageRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Intelligent Railway AI Assistant endpoint with function-calling dispatch
    for Live ETA, PNR verification, booking search, and complaints.
    """
    user_id = current_user.id if current_user else None
    return chatbot_service.process_message(req, user_id=user_id, db=db)
