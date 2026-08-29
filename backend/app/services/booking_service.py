import random
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.pnr import PNR
from app.models.user import User
from app.schemas.booking import TrainSearchResult, BookingRequest, PNROut
from app.services.eta_service import SAMPLE_TRAINS


class BookingService:
    def __init__(self):
        self.trains = SAMPLE_TRAINS

    def search_trains(
        self,
        from_station: Optional[str] = None,
        to_station: Optional[str] = None,
        journey_date: Optional[str] = None,
        travel_class: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        results = []
        from_code = from_station.upper().strip() if from_station else ""
        to_code = to_station.upper().strip() if to_station else ""

        for train in self.trains:
            # Check if stations exist on route
            stop_codes = [s["station_code"] for s in train["stops"]]
            from_match = (not from_code) or (from_code in stop_codes) or (from_code in train["source_station_name"].upper())
            to_match = (not to_code) or (to_code in stop_codes) or (to_code in train["dest_station_name"].upper())

            # If both codes provided, check order
            if from_code and to_code and from_code in stop_codes and to_code in stop_codes:
                if stop_codes.index(from_code) >= stop_codes.index(to_code):
                    continue

            if from_match and to_match:
                # Calculate class availability
                avail = {}
                for cls in train["classes_available"]:
                    avail[cls] = f"AVAILABLE-{random.randint(12, 85)}"

                results.append({
                    "train_no": train["train_no"],
                    "train_name": train["train_name"],
                    "train_type": train["train_type"],
                    "from_station_code": train["source_station_code"],
                    "from_station_name": train["source_station_name"],
                    "to_station_code": train["dest_station_code"],
                    "to_station_name": train["dest_station_name"],
                    "departure_time": train["departure_time"],
                    "arrival_time": train["arrival_time"],
                    "duration": f"{train['travel_time_hours']} hrs",
                    "classes_available": train["classes_available"],
                    "fares": train["base_fares"],
                    "availability": avail,
                    "runs_on": train["runs_on_days"]
                })

        return results

    def book_ticket(self, req: BookingRequest, user_id: int, db: Session) -> PNR:
        # Generate 10-digit realistic PNR
        pnr_id = "".join([str(random.randint(1, 9))] + [str(random.randint(0, 9)) for _ in range(9)])

        # Find train details
        train = next((t for t in self.trains if t["train_no"] == req.train_no), None)
        train_name = train["train_name"] if train else "Express Special"
        dep_time = train["departure_time"] if train else "08:00"
        arr_time = train["arrival_time"] if train else "18:00"
        fare = train["base_fares"].get(req.travel_class, 1250.0) if train else 1250.0

        # Coach and Berth Assignment
        coach_prefix = {
            "1A": "H",
            "2A": "A",
            "3A": "B",
            "SL": "S",
            "CC": "C",
            "EC": "E"
        }.get(req.travel_class, "B")
        coach = f"{coach_prefix}{random.randint(1, 6)}"
        berth = random.randint(1, 72)
        
        berth_types = ["Lower", "Middle", "Upper", "Side Lower", "Side Upper"]
        berth_type = req.berth_preference if req.berth_preference in berth_types else random.choice(berth_types)

        pnr_record = PNR(
            id=pnr_id,
            user_id=user_id,
            train_no=req.train_no,
            train_name=train_name,
            from_station=req.from_station.upper(),
            to_station=req.to_station.upper(),
            coach=coach,
            berth=berth,
            berth_type=berth_type,
            travel_class=req.travel_class,
            quota=req.quota,
            status="CNF",
            journey_date=req.journey_date,
            departure_time=dep_time,
            arrival_time=arr_time,
            fare=fare,
            passenger_name=req.passenger_name,
            passenger_age=req.passenger_age,
            passenger_gender=req.passenger_gender,
            created_at=datetime.utcnow()
        )

        db.add(pnr_record)
        db.commit()
        db.refresh(pnr_record)
        return pnr_record

    def get_pnr(self, pnr_id: str, db: Session) -> Optional[PNR]:
        return db.query(PNR).filter(PNR.id == pnr_id).first()

    def cancel_ticket(self, pnr_id: str, user_id: int, db: Session) -> Optional[PNR]:
        pnr = db.query(PNR).filter(PNR.id == pnr_id).first()
        if not pnr:
            return None
        pnr.status = "CANCELLED"
        db.commit()
        db.refresh(pnr)
        return pnr

    def list_user_pnrs(self, user_id: int, db: Session) -> List[PNR]:
        return db.query(PNR).filter(PNR.user_id == user_id).order_by(PNR.created_at.desc()).all()


booking_service = BookingService()
