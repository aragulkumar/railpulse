from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.deps import get_current_user_optional
from app.models.user import User
from app.models.pnr import PNR
from app.models.complaint import Complaint
from app.schemas.auth import UserOut
from app.schemas.profile import ProfileLanguageUpdate

router = APIRouter(prefix="/profile", tags=["Profile"])


def get_or_create_user(current_user: Optional[User], db: Session) -> User:
    if current_user:
        return current_user
    user = db.query(User).first()
    if not user:
        user = User(
            id=1,
            name="Ragul Kumar",
            phone="9876543210",
            email="ragul@railpulse.in",
            password_hash="demo_hashed_pass",
            preferred_language="en"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("")
def get_profile(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Get passenger profile details, trip counts, and active reservations."""
    user = get_or_create_user(current_user, db)
    total_trips = db.query(PNR).filter(PNR.user_id == user.id).count()
    active_trips = db.query(PNR).filter(PNR.user_id == user.id, PNR.status == "CNF").count()
    total_complaints = db.query(Complaint).filter(Complaint.user_id == user.id).count()

    return {
        "user": UserOut.model_validate(user),
        "total_trips": total_trips,
        "active_trips": active_trips,
        "total_complaints": total_complaints,
        "supported_languages": [
            {"code": "en", "label": "English"},
            {"code": "hi", "label": "हिन्दी (Hindi)"},
            {"code": "ta", "label": "தமிழ் (Tamil)"},
            {"code": "te", "label": "తెలుగు (Telugu)"},
            {"code": "bn", "label": "বাংলা (Bengali)"},
            {"code": "mr", "label": "मराठी (Marathi)"}
        ]
    }


@router.patch("/language")
def update_language(
    req: ProfileLanguageUpdate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Update passenger preferred language for app UI, voice prompts, and chatbot."""
    user = get_or_create_user(current_user, db)
    user.preferred_language = req.preferred_language
    db.commit()
    db.refresh(user)
    return {
        "message": f"Language updated to {req.preferred_language}",
        "preferred_language": user.preferred_language
    }
