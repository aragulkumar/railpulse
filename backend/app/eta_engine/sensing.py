from dataclasses import dataclass
from typing import Dict, List, Optional
import time
import random


@dataclass
class TelemetryFrame:
    train_no: str
    timestamp: float
    current_lat: float
    current_lng: float
    current_speed_kmh: float
    current_block_section: str
    signal_aspect: str  # GREEN, DOUBLE_YELLOW, YELLOW, RED
    gradient_per_thousand: float  # e.g. -2.5 or +5.0
    track_condition: str  # DRY, WET, FOGGY, CAUTION_ORDER
    temporary_speed_restriction_kmh: Optional[float]
    preceding_train_headway_km: float


class SensingLayer:
    """Layer 1: Sensing & Telemetry Ingestion from RTIS / COA / GPS."""

    def __init__(self):
        # Cache of latest telemetry per train
        self._telemetry_cache: Dict[str, TelemetryFrame] = {}

    def ingest_frame(self, frame: TelemetryFrame) -> TelemetryFrame:
        self._telemetry_cache[frame.train_no] = frame
        return frame

    def get_latest_telemetry(self, train_no: str) -> TelemetryFrame:
        if train_no in self._telemetry_cache:
            return self._telemetry_cache[train_no]
        
        # Synthetic telemetry baseline for prototype
        return TelemetryFrame(
            train_no=train_no,
            timestamp=time.time(),
            current_lat=28.6139,
            current_lng=77.2090,
            current_speed_kmh=88.5,
            current_block_section=f"SEC-{train_no}-04",
            signal_aspect="GREEN",
            gradient_per_thousand=-0.5,
            track_condition="DRY",
            temporary_speed_restriction_kmh=110.0,
            preceding_train_headway_km=14.2
        )


sensing_service = SensingLayer()
