from sqlalchemy import Column, Integer, String, DateTime, Float
from datetime import datetime
from app.db.session import Base


class ETASnapshot(Base):
    __tablename__ = "eta_snapshot"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    time = Column(DateTime, default=datetime.utcnow, index=True)
    train_no = Column(String, nullable=False, index=True)
    station_code = Column(String, nullable=False, index=True)
    scheduled_arrival = Column(String, nullable=False)
    estimated_eta = Column(String, nullable=False)
    delay_minutes = Column(Integer, default=0)
    confidence_low = Column(String, nullable=False)
    confidence_high = Column(String, nullable=False)
    explainability_text = Column(String, nullable=False)
    speed_kmh = Column(Float, default=78.5)
    distance_remaining_km = Column(Float, default=120.0)
    status = Column(String, default="RUNNING")  # ON_TIME, DELAYED, APPROACHING, ARRIVED
