from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SOSRequest(BaseModel):
    pnr_id: Optional[str] = None
    coach: Optional[str] = None
    berth: Optional[int] = None
    gps_lat: Optional[float] = None
    gps_lng: Optional[float] = None
    nearest_station: Optional[str] = None
    emergency_type: str = "Security / Threat"  # Medical, Security, Harassment, Fire
    description: str


class CleaningRequest(BaseModel):
    pnr_id: str
    coach: str
    berth: int
    cleaning_type: str = "Coach Floor & Toilet"  # Toilet, Floor, Berth, Linen, Trash
    description: Optional[str] = "Immediate cleaning required"


class GeneralComplaintRequest(BaseModel):
    pnr_id: Optional[str] = None
    category: str = "Punctuality / Overcrowding"  # Electrical, Catering, Staff Behavior, Water
    coach: Optional[str] = None
    berth: Optional[int] = None
    description: str


class SeatSwapCreateRequest(BaseModel):
    requester_pnr_id: str
    preferred_berth_type: str = "Lower"  # Lower, Middle, Side Lower
    reason: str = "Senior Citizen / Medical condition"


class SeatSwapRespondRequest(BaseModel):
    action: str  # accept, decline


class ComplaintOut(BaseModel):
    id: int
    pnr_id: Optional[str]
    user_id: int
    type: str
    category: Optional[str]
    coach: Optional[str]
    berth: Optional[int]
    gps_lat: Optional[float]
    gps_lng: Optional[float]
    nearest_station: Optional[str]
    description: str
    status: str
    priority: str
    assigned_to: Optional[str]
    resolution_notes: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class SeatSwapOut(BaseModel):
    id: int
    complaint_id: int
    requester_pnr_id: str
    target_pnr_id: Optional[str]
    requester_coach: str
    requester_berth: int
    requester_berth_type: str
    target_coach: Optional[str]
    target_berth: Optional[int]
    preferred_berth_type: str
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
