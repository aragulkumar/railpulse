from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    pnr_id = Column(String, ForeignKey("pnr.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # sos, cleaning, seat_swap, general
    category = Column(String, default="General")  # e.g., Medical, Security, Coach Hygiene, Electrical
    coach = Column(String, nullable=True)
    berth = Column(Integer, nullable=True)
    gps_lat = Column(Float, nullable=True)
    gps_lng = Column(Float, nullable=True)
    nearest_station = Column(String, nullable=True)
    description = Column(Text, nullable=False)
    status = Column(String, default="filed")  # filed, acknowledged, in_progress, resolved
    priority = Column(String, default="normal")  # emergency, high, normal, low
    assigned_to = Column(String, nullable=True)  # RPF Post, OBHS Team, TTE, Station Master
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="complaints")
    pnr = relationship("PNR", back_populates="complaints")
    seat_swap = relationship("SeatSwapRequest", back_populates="complaint", uselist=False)


class SeatSwapRequest(Base):
    __tablename__ = "seat_swap_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    requester_pnr_id = Column(String, ForeignKey("pnr.id"), nullable=False)
    target_pnr_id = Column(String, ForeignKey("pnr.id"), nullable=True)
    requester_coach = Column(String, nullable=False)
    requester_berth = Column(Integer, nullable=False)
    requester_berth_type = Column(String, nullable=False)
    target_coach = Column(String, nullable=True)
    target_berth = Column(Integer, nullable=True)
    preferred_berth_type = Column(String, default="Lower")  # Lower, Middle, Upper, Side Lower
    reason = Column(String, default="Senior Citizen / Medical / Family proximity")
    status = Column(String, default="pending")  # pending, accepted, declined, tte_approved
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="seat_swap")
