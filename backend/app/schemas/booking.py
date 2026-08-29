from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime


class TrainSearchResult(BaseModel):
    train_no: str
    train_name: str
    train_type: str
    from_station_code: str
    from_station_name: str
    to_station_code: str
    to_station_name: str
    departure_time: str
    arrival_time: str
    duration: str
    classes_available: List[str]
    fares: Dict[str, float]
    availability: Dict[str, str]  # e.g., {"3A": "AVAILABLE-42", "SL": "RAC-12"}
    runs_on: List[str]


class BookingRequest(BaseModel):
    train_no: str
    from_station: str
    to_station: str
    travel_class: str  # 1A, 2A, 3A, SL, CC
    quota: str = "GN"
    journey_date: str  # YYYY-MM-DD
    passenger_name: str
    passenger_age: int
    passenger_gender: str = "M"
    berth_preference: Optional[str] = "Lower"  # Lower, Middle, Upper, Side Lower, Side Upper


class PNROut(BaseModel):
    id: str  # 10-digit PNR
    user_id: int
    train_no: str
    train_name: str
    from_station: str
    to_station: str
    coach: str
    berth: int
    berth_type: str
    travel_class: str
    quota: str
    status: str
    journey_date: str
    departure_time: str
    arrival_time: str
    fare: float
    passenger_name: str
    passenger_age: int
    passenger_gender: str
    created_at: datetime

    class Config:
        from_attributes = True
