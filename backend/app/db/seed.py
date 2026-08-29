from datetime import datetime
from app.db.session import SessionLocal, engine, Base
from app.models.user import User
from app.models.pnr import PNR
from app.models.train import Train
from app.models.complaint import Complaint, SeatSwapRequest
from app.models.notification import Notification
from app.core.security import get_password_hash
from app.services.eta_service import SAMPLE_TRAINS


def seed_database():
    print("🌱 Seeding RailPulse database with realistic test data...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed Demo User
        user = db.query(User).filter(User.phone == "9876543210").first()
        if not user:
            user = User(
                name="Ragul Kumar",
                phone="9876543210",
                email="ragul@railpulse.in",
                password_hash=get_password_hash("railpulse123"),
                preferred_language="en",
                created_at=datetime.utcnow()
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print("✅ User created: Ragul Kumar (phone: 9876543210, pass: railpulse123)")

        # 2. Seed Trains
        for t_data in SAMPLE_TRAINS:
            existing_train = db.query(Train).filter(Train.train_no == t_data["train_no"]).first()
            if not existing_train:
                train = Train(
                    train_no=t_data["train_no"],
                    train_name=t_data["train_name"],
                    train_type=t_data["train_type"],
                    source_station_code=t_data["source_station_code"],
                    source_station_name=t_data["source_station_name"],
                    dest_station_code=t_data["dest_station_code"],
                    dest_station_name=t_data["dest_station_name"],
                    departure_time=t_data["departure_time"],
                    arrival_time=t_data["arrival_time"],
                    travel_time_hours=t_data["travel_time_hours"],
                    total_distance_km=t_data["total_distance_km"],
                    current_speed=t_data["current_speed"],
                    current_location_desc=t_data["current_location_desc"],
                    current_lat=t_data["current_lat"],
                    current_lng=t_data["current_lng"],
                    classes_available=t_data["classes_available"],
                    base_fares=t_data["base_fares"],
                    runs_on_days=t_data["runs_on_days"],
                    intermediate_stops=t_data["stops"]
                )
                db.add(train)
        db.commit()
        print("✅ Master trains seeded (12951, 22436, 12002, 12626)")

        # 3. Seed Sample Active PNRs
        pnr_demo = db.query(PNR).filter(PNR.id == "8421950341").first()
        if not pnr_demo:
            pnr1 = PNR(
                id="8421950341",
                user_id=user.id,
                train_no="12951",
                train_name="Mumbai Rajdhani Express",
                from_station="MMCT",
                to_station="NDLS",
                coach="B2",
                berth=45,
                berth_type="Upper",
                travel_class="3A",
                quota="GN",
                status="CNF",
                journey_date="2026-09-02",
                departure_time="17:00",
                arrival_time="08:32",
                fare=2040.0,
                passenger_name="Ragul Kumar",
                passenger_age=28,
                passenger_gender="M"
            )
            pnr2 = PNR(
                id="7123904421",
                user_id=user.id,
                train_no="22436",
                train_name="Vande Bharat Express",
                from_station="NDLS",
                to_station="BSB",
                coach="C2",
                berth=18,
                berth_type="Window",
                travel_class="CC",
                quota="GN",
                status="CNF",
                journey_date="2026-09-08",
                departure_time="06:00",
                arrival_time="14:00",
                fare=1750.0,
                passenger_name="Ragul Kumar",
                passenger_age=28,
                passenger_gender="M"
            )
            db.add_all([pnr1, pnr2])
            db.commit()
            print("✅ Sample PNRs seeded: 8421950341 (Rajdhani) & 7123904421 (Vande Bharat)")

        # 4. Seed Sample Seat Swap Request
        swap_comp = db.query(Complaint).filter(Complaint.type == "seat_swap").first()
        if not swap_comp:
            comp = Complaint(
                pnr_id="8421950341",
                user_id=user.id,
                type="seat_swap",
                category="Seat / Berth Swap Assistance",
                coach="B2",
                berth=45,
                description="Seat swap requested from Upper (B2-45) to Lower. Senior Citizen accompanying.",
                status="filed",
                priority="normal",
                assigned_to="TTE & Fellow Passengers",
                created_at=datetime.utcnow()
            )
            db.add(comp)
            db.commit()
            db.refresh(comp)

            swap = SeatSwapRequest(
                complaint_id=comp.id,
                requester_pnr_id="8421950341",
                requester_coach="B2",
                requester_berth=45,
                requester_berth_type="Upper",
                preferred_berth_type="Lower",
                reason="Senior Citizen with knee difficulty",
                status="pending",
                created_at=datetime.utcnow()
            )
            db.add(swap)
            db.commit()
            print("✅ Sample Seat Swap Request seeded")

        print("🎉 Database seeding completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
