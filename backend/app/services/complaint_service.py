from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.complaint import Complaint, SeatSwapRequest
from app.models.pnr import PNR
from app.models.notification import Notification
from app.schemas.complaint import (
    SOSRequest, CleaningRequest, GeneralComplaintRequest,
    SeatSwapCreateRequest, SeatSwapRespondRequest
)
from app.core.redis_client import redis_client


class ComplaintService:
    def create_sos(self, req: SOSRequest, user_id: int, db: Session) -> Complaint:
        coach = req.coach
        berth = req.berth

        # If PNR supplied, fill coach & berth if missing
        if req.pnr_id:
            pnr = db.query(PNR).filter(PNR.id == req.pnr_id).first()
            if pnr:
                coach = coach or pnr.coach
                berth = berth or pnr.berth

        complaint = Complaint(
            pnr_id=req.pnr_id,
            user_id=user_id,
            type="sos",
            category=req.emergency_type,
            coach=coach,
            berth=berth,
            gps_lat=req.gps_lat or 28.6139,
            gps_lng=req.gps_lng or 77.2090,
            nearest_station=req.nearest_station or "Approaching Junction Section",
            description=req.description,
            status="acknowledged",  # Instantly acknowledged for SOS
            priority="emergency",
            assigned_to="RPF Quick Response Team & Train Superintendent",
            resolution_notes="RPF Post and On-board Escort alerted. Estimated response at next signal or in-coach: 3 mins.",
            created_at=datetime.utcnow()
        )
        db.add(complaint)
        db.commit()
        db.refresh(complaint)

        # Notify user
        notif = Notification(
            user_id=user_id,
            type="sos_alert",
            title="EMERGENCY SOS DISPATCHED",
            body=f"RPF & On-board staff notified for Coach {coach}, Berth {berth}. Help is on the way.",
            deep_link=f"/complaints/{complaint.id}",
            created_at=datetime.utcnow()
        )
        db.add(notif)
        db.commit()

        # Publish SOS to Redis control room channel
        redis_client.publish("control_room:sos", {
            "complaint_id": complaint.id,
            "emergency_type": req.emergency_type,
            "coach": coach,
            "berth": berth,
            "lat": complaint.gps_lat,
            "lng": complaint.gps_lng,
            "time": datetime.utcnow().isoformat()
        })

        return complaint

    def create_cleaning_request(self, req: CleaningRequest, user_id: int, db: Session) -> Complaint:
        complaint = Complaint(
            pnr_id=req.pnr_id,
            user_id=user_id,
            type="cleaning",
            category=req.cleaning_type,
            coach=req.coach,
            berth=req.berth,
            description=f"Request for {req.cleaning_type}: {req.description}",
            status="acknowledged",
            priority="normal",
            assigned_to="On-Board Housekeeping Staff (OBHS)",
            resolution_notes="OBHS attendant dispatched to coach.",
            created_at=datetime.utcnow()
        )
        db.add(complaint)
        db.commit()
        db.refresh(complaint)

        notif = Notification(
            user_id=user_id,
            type="complaint_update",
            title="Cleaning Request Registered",
            body=f"OBHS team assigned for Coach {req.coach}, Berth {req.berth}.",
            deep_link=f"/complaints/{complaint.id}",
            created_at=datetime.utcnow()
        )
        db.add(notif)
        db.commit()

        return complaint

    def create_general_complaint(self, req: GeneralComplaintRequest, user_id: int, db: Session) -> Complaint:
        coach = req.coach
        berth = req.berth
        if req.pnr_id:
            pnr = db.query(PNR).filter(PNR.id == req.pnr_id).first()
            if pnr:
                coach = coach or pnr.coach
                berth = berth or pnr.berth

        complaint = Complaint(
            pnr_id=req.pnr_id,
            user_id=user_id,
            type="general",
            category=req.category,
            coach=coach,
            berth=berth,
            description=req.description,
            status="filed",
            priority="normal",
            assigned_to="Divisional Grievance Cell",
            resolution_notes="Complaint queued for investigation.",
            created_at=datetime.utcnow()
        )
        db.add(complaint)
        db.commit()
        db.refresh(complaint)
        return complaint

    def create_seat_swap_request(self, req: SeatSwapCreateRequest, user_id: int, db: Session) -> Dict[str, Any]:
        pnr = db.query(PNR).filter(PNR.id == req.requester_pnr_id).first()
        if not pnr:
            pnr_coach = "B2"
            pnr_berth = 45
            pnr_type = "Upper"
        else:
            pnr_coach = pnr.coach
            pnr_berth = pnr.berth
            pnr_type = pnr.berth_type

        # Create umbrella complaint
        complaint = Complaint(
            pnr_id=req.requester_pnr_id,
            user_id=user_id,
            type="seat_swap",
            category="Seat / Berth Swap Assistance",
            coach=pnr_coach,
            berth=pnr_berth,
            description=f"Seat swap requested from {pnr_type} ({pnr_coach}-{pnr_berth}) to preferred {req.preferred_berth_type}. Reason: {req.reason}",
            status="filed",
            priority="normal",
            assigned_to="TTE & Fellow Passengers",
            created_at=datetime.utcnow()
        )
        db.add(complaint)
        db.commit()
        db.refresh(complaint)

        # Create specific seat swap row
        swap = SeatSwapRequest(
            complaint_id=complaint.id,
            requester_pnr_id=req.requester_pnr_id,
            target_pnr_id=None,
            requester_coach=pnr_coach,
            requester_berth=pnr_berth,
            requester_berth_type=pnr_type,
            preferred_berth_type=req.preferred_berth_type,
            reason=req.reason,
            status="pending",
            created_at=datetime.utcnow()
        )
        db.add(swap)
        db.commit()
        db.refresh(swap)

        return {
            "complaint": complaint,
            "swap_request": swap
        }

    def respond_seat_swap(self, swap_id: int, action: str, target_pnr_id: Optional[str], db: Session) -> SeatSwapRequest:
        swap = db.query(SeatSwapRequest).filter(SeatSwapRequest.id == swap_id).first()
        if not swap:
            return None
        
        if action == "accept":
            swap.status = "accepted"
            swap.target_pnr_id = target_pnr_id or "8421950999"
            swap.target_coach = "B2"
            swap.target_berth = 12
            # Update parent complaint
            swap.complaint.status = "in_progress"
            swap.complaint.resolution_notes = "Passenger agreed to swap; awaiting TTE digital endorsement."
        elif action == "tte_approved":
            swap.status = "tte_approved"
            swap.complaint.status = "resolved"
            swap.complaint.resolved_at = datetime.utcnow()
            swap.complaint.resolution_notes = "Berth swap formally approved and updated in TTE Handheld Terminal (HHT)."
        else:
            swap.status = "declined"
            swap.complaint.status = "resolved"
            swap.complaint.resolution_notes = "Seat swap declined by passenger or TTE."

        db.commit()
        db.refresh(swap)
        return swap

    def get_complaint(self, complaint_id: int, db: Session) -> Optional[Complaint]:
        return db.query(Complaint).filter(Complaint.id == complaint_id).first()

    def list_user_complaints(self, user_id: int, db: Session) -> List[Complaint]:
        return db.query(Complaint).filter(Complaint.user_id == user_id).order_by(Complaint.created_at.desc()).all()

    def list_all_complaints(self, db: Session) -> List[Complaint]:
        return db.query(Complaint).order_by(Complaint.created_at.desc()).all()


complaint_service = ComplaintService()
