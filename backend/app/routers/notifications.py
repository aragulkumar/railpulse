from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.deps import get_current_user_optional
from app.models.user import User
from app.schemas.notification import NotificationOut
from app.services.notification_service import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_user_id(current_user: Optional[User], db: Session) -> int:
    if current_user:
        return current_user.id
    user = db.query(User).first()
    return user.id if user else 1


@router.get("", response_model=List[NotificationOut])
def get_notifications(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Retrieve passenger notification feed including real-time delay alerts & platform updates."""
    user_id = get_user_id(current_user, db)
    return notification_service.list_notifications(user_id=user_id, db=db)


@router.post("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Mark a notification as read."""
    user_id = get_user_id(current_user, db)
    notif = notification_service.mark_read(notification_id, user_id=user_id, db=db)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif
