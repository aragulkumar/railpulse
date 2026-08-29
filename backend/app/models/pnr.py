from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.session import Base


class PNR(Base):
    __tablename__ = "pnr"

    id = Column(String, primary_key=True, index=True)  # 10 digit PNR e.g. "8421950341"
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    train_no = Column(String, nullable=False, index=True)
    train_name = Column(String, nullable=False)
    from_station = Column(String, nullable=False)
    to_station = Column(String, nullable=False)
    coach = Column(String, nullable=False)  # e.g. "B2", "S4", "A1"
    berth = Column(Integer, nullable=False)  # e.g. 45
    berth_type = Column(String, default="SL")  # e.g. "Lower", "Middle", "Upper", "Side Lower", "Side Upper"
    travel_class = Column(String, default="3A")  # 1A, 2A, 3A, SL, CC, 2S
    quota = Column(String, default="GN")  # General, Tatkal, Senior Citizen, Ladies
    status = Column(String, default="CNF")  # CNF, RAC, WL, CANCELLED
    journey_date = Column(String, nullable=False)  # YYYY-MM-DD
    departure_time = Column(String, default="08:00")
    arrival_time = Column(String, default="18:30")
    fare = Column(Float, default=1250.0)
    passenger_name = Column(String, nullable=False)
    passenger_age = Column(Integer, default=28)
    passenger_gender = Column(String, default="M")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="pnrs")
    complaints = relationship("Complaint", back_populates="pnr")
