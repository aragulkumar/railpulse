from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.deps import get_current_user, get_current_user_optional
from app.models.user import User
from app.schemas.booking import TrainSearchResult, BookingRequest, PNROut
from app.services.booking_service import booking_service

router = APIRouter(prefix="/booking", tags=["Booking"])


@router.get("/search", response_model=List[TrainSearchResult])
def search_trains(
    from_station: Optional[str] = Query(None, alias="from"),
    to_station: Optional[str] = Query(None, alias="to"),
    date: Optional[str] = Query(None),
    travel_class: Optional[str] = Query(None, alias="class")
):
    """Search trains between stations with real-time class fares and availability."""
    results = booking_service.search_trains(
        from_station=from_station,
        to_station=to_station,
        journey_date=date,
        travel_class=travel_class
    )
    return results


@router.post("/book", response_model=PNROut)
def book_ticket(
    req: BookingRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Book a train ticket with instant PNR allocation and seat assignment."""
    # Use current authenticated user or fallback guest user
    user_id = current_user.id if current_user else 1
    
    # Ensure guest user exists if user_id=1
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            id=1,
            name=req.passenger_name or "Guest Passenger",
            phone="9876543210",
            email="passenger@railpulse.in",
            password_hash="guest_hash"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    pnr = booking_service.book_ticket(req, user_id=user.id, db=db)
    return pnr


@router.get("/pnr/{pnr_id}", response_model=PNROut)
def get_pnr_status(pnr_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed PNR information, seat, status, and journey details."""
    pnr = booking_service.get_pnr(pnr_id, db=db)
    if not pnr:
        raise HTTPException(status_code=404, detail=f"PNR {pnr_id} not found")
    return pnr


@router.post("/cancel/{pnr_id}", response_model=PNROut)
def cancel_pnr(
    pnr_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Cancel booking for a given PNR."""
    user_id = current_user.id if current_user else 1
    pnr = booking_service.cancel_ticket(pnr_id, user_id=user_id, db=db)
    if not pnr:
        raise HTTPException(status_code=404, detail=f"PNR {pnr_id} not found")
    return pnr


@router.get("/my-tickets", response_model=List[PNROut])
def list_my_tickets(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else 1
    return booking_service.list_user_pnrs(user_id=user_id, db=db)
