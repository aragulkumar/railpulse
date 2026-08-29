from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class IntermediateStopETA(BaseModel):
    station_code: str
    station_name: str
    scheduled_arrival: str
    estimated_eta: str
    delay_minutes: int
    platform: Optional[str] = "1"
    status: str  # ON_TIME, DELAYED, PASSED, CURRENT


class TrainLiveETA(BaseModel):
    train_no: str
    train_name: str
    train_type: str
    source_station_code: str
    source_station_name: str
    dest_station_code: str
    dest_station_name: str
    current_station_or_section: str
    current_speed_kmh: float
    current_lat: float
    current_lng: float
    overall_delay_minutes: int
    confidence_low: str
    confidence_high: str
    explainability_text: str
    last_updated: str
    stops: List[IntermediateStopETA]


class StationTrainSummary(BaseModel):
    train_no: str
    train_name: str
    train_type: str
    scheduled_time: str
    expected_time: str
    delay_minutes: int
    platform: str
    direction: str  # ARRIVING, DEPARTING
    status: str
    confidence_range: str
    explainability_summary: str


class StationETAResponse(BaseModel):
    station_code: str
    station_name: str
    timestamp: str
    total_trains: int
    trains: List[StationTrainSummary]
