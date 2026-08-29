from sqlalchemy import Column, Integer, String, Float, Boolean, JSON
from app.db.session import Base


class Train(Base):
    __tablename__ = "trains"

    train_no = Column(String, primary_key=True, index=True)
    train_name = Column(String, nullable=False)
    train_type = Column(String, default="Express")  # Rajdhani, Shatabdi, Vande Bharat, Superfast, Mail/Express
    source_station_code = Column(String, nullable=False)
    source_station_name = Column(String, nullable=False)
    dest_station_code = Column(String, nullable=False)
    dest_station_name = Column(String, nullable=False)
    departure_time = Column(String, nullable=False)
    arrival_time = Column(String, nullable=False)
    travel_time_hours = Column(Float, default=12.5)
    total_distance_km = Column(Float, default=950.0)
    current_speed = Column(Float, default=85.0)
    current_location_desc = Column(String, default="Approaching section signal")
    current_lat = Column(Float, default=28.6139)
    current_lng = Column(Float, default=77.2090)
    classes_available = Column(JSON, default=list)  # ["1A", "2A", "3A", "SL"]
    base_fares = Column(JSON, default=dict)  # {"1A": 3200, "2A": 1950, "3A": 1350, "SL": 490}
    runs_on_days = Column(JSON, default=lambda: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
    intermediate_stops = Column(JSON, default=list)  # list of stops with arrival, departure, km, platform, delay
