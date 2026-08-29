from pydantic import BaseModel, ConfigDict
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
    availability: Dict[str, str]
    runs_on: List[str]


class BookingRequest(BaseModel):
    train_no: str
    from_station: str
    to_station: str
    travel_class: str
    quota: str = "GN"
    journey_date: str
    passenger_name: str
    passenger_age: int
    passenger_gender: str = "M"
    berth_preference: Optional[str] = "Lower"


class PNROut(BaseModel):
    id: str
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
    model_config = ConfigDict(from_attributes=True)
