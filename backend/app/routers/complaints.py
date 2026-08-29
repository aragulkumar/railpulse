from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.deps import get_current_user_optional
from app.models.user import User
from app.schemas.complaint import (
    SOSRequest, CleaningRequest, GeneralComplaintRequest,
    SeatSwapCreateRequest, SeatSwapRespondRequest,
    ComplaintOut, SeatSwapOut
)
from app.services.complaint_service import complaint_service

router = APIRouter(prefix="/complaints", tags=["Complaints & SOS"])


def get_default_user_id(current_user: Optional[User], db: Session) -> int:
    if current_user:
        return current_user.id
    user = db.query(User).first()
    if not user:
        user = User(
            id=1,
            name="Demo Passenger",
            phone="9876543210",
            email="passenger@railpulse.in",
            password_hash="demo_hash"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user.id


@router.post("/sos", response_model=ComplaintOut)
def trigger_emergency_sos(
    req: SOSRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Emergency 1-tap SOS alerting RPF, Train Captain, and Control Office with live coordinates."""
    user_id = get_default_user_id(current_user, db)
    return complaint_service.create_sos(req, user_id=user_id, db=db)


@router.post("/cleaning", response_model=ComplaintOut)
def request_coach_cleaning(
    req: CleaningRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Request OBHS On-Board Housekeeping staff for coach or toilet sanitization."""
    user_id = get_default_user_id(current_user, db)
    return complaint_service.create_cleaning_request(req, user_id=user_id, db=db)


@router.post("/swap/request")
def create_seat_swap(
    req: SeatSwapCreateRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Broadcast peer-to-peer seat swap request to eligible co-passengers & TTE."""
    user_id = get_default_user_id(current_user, db)
    result = complaint_service.create_seat_swap_request(req, user_id=user_id, db=db)
    return {
        "message": "Seat swap broadcasted successfully",
        "complaint_id": result["complaint"].id,
        "swap_id": result["swap_request"].id,
        "status": result["swap_request"].status
    }


@router.post("/swap/{swap_id}/respond", response_model=SeatSwapOut)
def respond_seat_swap(
    swap_id: int,
    req: SeatSwapRespondRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Accept, decline, or TTE-approve an open seat swap request."""
    swap = complaint_service.respond_seat_swap(
        swap_id=swap_id,
        action=req.action,
        target_pnr_id="8421950888",
        db=db
    )
    if not swap:
        raise HTTPException(status_code=404, detail="Swap request not found")
    return swap


@router.post("/general", response_model=ComplaintOut)
def file_general_complaint(
    req: GeneralComplaintRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """File general grievance (Punctuality, Catering, Electrical, Linen, Staff)."""
    user_id = get_default_user_id(current_user, db)
    return complaint_service.create_general_complaint(req, user_id=user_id, db=db)


@router.get("/{complaint_id}/status", response_model=ComplaintOut)
def get_complaint_status(complaint_id: int, db: Session = Depends(get_db)):
    """Check live status, assigned officer, and resolution notes for a complaint."""
    complaint = complaint_service.get_complaint(complaint_id, db=db)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.get("/list/my", response_model=List[ComplaintOut])
def list_my_complaints(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = get_default_user_id(current_user, db)
    return complaint_service.list_user_complaints(user_id=user_id, db=db)
