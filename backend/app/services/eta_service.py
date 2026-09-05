from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.train import Train
from app.models.eta_snapshot import ETASnapshot
from app.eta_engine.sensing import sensing_service, TelemetryFrame
from app.eta_engine.estimation import estimation_service
from app.eta_engine.propagation import propagation_service
from app.eta_engine.delivery import delivery_service
from app.core.redis_client import redis_client

# Built-in seed data for prominent Indian Railways trains
SAMPLE_TRAINS = [
    {
        "train_no": "12951",
        "train_name": "Mumbai Rajdhani Express",
        "train_type": "Rajdhani Express",
        "source_station_code": "MMCT",
        "source_station_name": "Mumbai Central",
        "dest_station_code": "NDLS",
        "dest_station_name": "New Delhi",
        "departure_time": "17:00",
        "arrival_time": "08:32",
        "travel_time_hours": 15.5,
        "total_distance_km": 1384.0,
        "current_speed": 118.0,
        "current_location_desc": "Approaching Kota Junction outer",
        "current_lat": 25.1825,
        "current_lng": 75.8390,
        "classes_available": ["1A", "2A", "3A"],
        "base_fares": {"1A": 4850.0, "2A": 2870.0, "3A": 2040.0},
        "runs_on_days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "base_delay_min": 14,
        "stops": [
            {"station_code": "MMCT", "station_name": "Mumbai Central", "scheduled_arrival": "17:00", "scheduled_section_duration_min": 0, "platform": "1", "distance_km": 0},
            {"station_code": "BVI", "station_name": "Borivali", "scheduled_arrival": "17:22", "scheduled_section_duration_min": 22, "platform": "6", "distance_km": 30},
            {"station_code": "ST", "station_name": "Surat", "scheduled_arrival": "19:43", "scheduled_section_duration_min": 135, "platform": "1", "distance_km": 263},
            {"station_code": "BRC", "station_name": "Vadodara Jn", "scheduled_arrival": "21:06", "scheduled_section_duration_min": 80, "platform": "2", "distance_km": 392},
            {"station_code": "RTM", "station_name": "Ratlam Jn", "scheduled_arrival": "00:25", "scheduled_section_duration_min": 190, "platform": "4", "distance_km": 653},
            {"station_code": "KOTA", "station_name": "Kota Jn", "scheduled_arrival": "03:15", "scheduled_section_duration_min": 170, "platform": "1", "distance_km": 920},
            {"station_code": "NDLS", "station_name": "New Delhi", "scheduled_arrival": "08:32", "scheduled_section_duration_min": 310, "platform": "3", "distance_km": 1384}
        ]
    },
    {
        "train_no": "22436",
        "train_name": "Vande Bharat Express",
        "train_type": "Vande Bharat",
        "source_station_code": "NDLS",
        "source_station_name": "New Delhi",
        "dest_station_code": "BSB",
        "dest_station_name": "Varanasi Jn",
        "departure_time": "06:00",
        "arrival_time": "14:00",
        "travel_time_hours": 8.0,
        "total_distance_km": 759.0,
        "current_speed": 128.5,
        "current_location_desc": "Cruising between Kanpur and Prayagraj section",
        "current_lat": 26.4499,
        "current_lng": 80.3319,
        "classes_available": ["EC", "CC"],
        "base_fares": {"EC": 3120.0, "CC": 1750.0},
        "runs_on_days": ["Tue", "Wed", "Fri", "Sat", "Sun"],
        "base_delay_min": 2,
        "stops": [
            {"station_code": "NDLS", "station_name": "New Delhi", "scheduled_arrival": "06:00", "scheduled_section_duration_min": 0, "platform": "16", "distance_km": 0},
            {"station_code": "CNB", "station_name": "Kanpur Central", "scheduled_arrival": "10:08", "scheduled_section_duration_min": 248, "platform": "5", "distance_km": 440},
            {"station_code": "PRYJ", "station_name": "Prayagraj Jn", "scheduled_arrival": "12:08", "scheduled_section_duration_min": 120, "platform": "6", "distance_km": 635},
            {"station_code": "BSB", "station_name": "Varanasi Jn", "scheduled_arrival": "14:00", "scheduled_section_duration_min": 112, "platform": "1", "distance_km": 759}
        ]
    },
    {
        "train_no": "12002",
        "train_name": "Bhopal Shatabdi Express",
        "train_type": "Shatabdi Express",
        "source_station_code": "NDLS",
        "source_station_name": "New Delhi",
        "dest_station_code": "RKMP",
        "dest_station_name": "Rani Kamlapati (Bhopal)",
        "departure_time": "06:00",
        "arrival_time": "14:40",
        "travel_time_hours": 8.6,
        "total_distance_km": 707.0,
        "current_speed": 92.0,
        "current_location_desc": "Departed Agra Cantt on green signal",
        "current_lat": 27.1767,
        "current_lng": 78.0081,
        "classes_available": ["EC", "CC"],
        "base_fares": {"EC": 2540.0, "CC": 1420.0},
        "runs_on_days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "base_delay_min": 8,
        "stops": [
            {"station_code": "NDLS", "station_name": "New Delhi", "scheduled_arrival": "06:00", "scheduled_section_duration_min": 0, "platform": "1", "distance_km": 0},
            {"station_code": "MTJ", "station_name": "Mathura Jn", "scheduled_arrival": "07:19", "scheduled_section_duration_min": 79, "platform": "1", "distance_km": 141},
            {"station_code": "AGC", "station_name": "Agra Cantt", "scheduled_arrival": "07:50", "scheduled_section_duration_min": 31, "platform": "1", "distance_km": 195},
            {"station_code": "GWL", "station_name": "Gwalior Jn", "scheduled_arrival": "09:23", "scheduled_section_duration_min": 90, "platform": "2", "distance_km": 313},
            {"station_code": "VGLJ", "station_name": "V Lakshmibai Jhansi", "scheduled_arrival": "10:45", "scheduled_section_duration_min": 80, "platform": "1", "distance_km": 410},
            {"station_code": "BPL", "station_name": "Bhopal Jn", "scheduled_arrival": "14:15", "scheduled_section_duration_min": 205, "platform": "1", "distance_km": 701},
            {"station_code": "RKMP", "station_name": "Rani Kamlapati", "scheduled_arrival": "14:40", "scheduled_section_duration_min": 25, "platform": "1", "distance_km": 707}
        ]
    },
    {
        "train_no": "12626",
        "train_name": "Kerala Express",
        "train_type": "Superfast Express",
        "source_station_code": "NDLS",
        "source_station_name": "New Delhi",
        "dest_station_code": "TVC",
        "dest_station_name": "Thiruvananthapuram Central",
        "departure_time": "20:10",
        "arrival_time": "18:00",
        "travel_time_hours": 45.8,
        "total_distance_km": 3036.0,
        "current_speed": 74.0,
        "current_location_desc": "Approaching Nagpur Junction section",
        "current_lat": 21.1458,
        "current_lng": 79.0882,
        "classes_available": ["2A", "3A", "SL"],
        "base_fares": {"2A": 3450.0, "3A": 2350.0, "SL": 890.0},
        "runs_on_days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "base_delay_min": 22,
        "stops": [
            {"station_code": "NDLS", "station_name": "New Delhi", "scheduled_arrival": "20:10", "scheduled_section_duration_min": 0, "platform": "3", "distance_km": 0},
            {"station_code": "AGC", "station_name": "Agra Cantt", "scheduled_arrival": "22:20", "scheduled_section_duration_min": 130, "platform": "1", "distance_km": 195},
            {"station_code": "GWL", "station_name": "Gwalior Jn", "scheduled_arrival": "23:45", "scheduled_section_duration_min": 85, "platform": "2", "distance_km": 313},
            {"station_code": "BPL", "station_name": "Bhopal Jn", "scheduled_arrival": "05:30", "scheduled_section_duration_min": 340, "platform": "1", "distance_km": 701},
            {"station_code": "NGP", "station_name": "Nagpur Jn", "scheduled_arrival": "11:55", "scheduled_section_duration_min": 375, "platform": "2", "distance_km": 1091},
            {"station_code": "BPQ", "station_name": "Balharshah Jn", "scheduled_arrival": "15:20", "scheduled_section_duration_min": 200, "platform": "1", "distance_km": 1300},
    {
        "train_no": "20607",
        "train_name": "Vande Bharat Express (MAS → SBC)",
        "train_type": "Vande Bharat",
        "source_station_code": "MAS",
        "source_station_name": "MGR Chennai Central",
        "dest_station_code": "SBC",
        "dest_station_name": "KSR Bengaluru",
        "departure_time": "05:50",
        "arrival_time": "10:15",
        "travel_time_hours": 4.4,
        "total_distance_km": 359.0,
        "current_speed": 130.0,
        "current_location_desc": "Cruising between Katpadi Jn and Jolarpettai Jn",
        "current_lat": 12.9249,
        "current_lng": 79.1352,
        "classes_available": ["EC", "CC"],
        "base_fares": {"EC": 1950.0, "CC": 995.0},
        "runs_on_days": ["Mon", "Tue", "Wed", "Fri", "Sat", "Sun"],
        "base_delay_min": 0,
        "stops": [
            {"station_code": "MAS", "station_name": "MGR Chennai Central", "scheduled_arrival": "05:50", "scheduled_section_duration_min": 0, "platform": "2", "distance_km": 0},
            {"station_code": "KPD", "station_name": "Katpadi Jn", "scheduled_arrival": "07:13", "scheduled_section_duration_min": 83, "platform": "1", "distance_km": 130},
            {"station_code": "BWT", "station_name": "Bangarapet Jn", "scheduled_arrival": "09:08", "scheduled_section_duration_min": 115, "platform": "3", "distance_km": 289},
            {"station_code": "KJM", "station_name": "Krishnarajapuram", "scheduled_arrival": "09:53", "scheduled_section_duration_min": 45, "platform": "4", "distance_km": 345},
            {"station_code": "SBC", "station_name": "KSR Bengaluru", "scheduled_arrival": "10:15", "scheduled_section_duration_min": 22, "platform": "7", "distance_km": 359}
        ]
    },
    {
        "train_no": "12673",
        "train_name": "Cheran Superfast Express (MAS → CBE)",
        "train_type": "Superfast Express",
        "source_station_code": "MAS",
        "source_station_name": "MGR Chennai Central",
        "dest_station_code": "CBE",
        "dest_station_name": "Coimbatore Jn",
        "departure_time": "22:00",
        "arrival_time": "06:00",
        "travel_time_hours": 8.0,
        "total_distance_km": 497.0,
        "current_speed": 105.0,
        "current_location_desc": "Approaching Salem Junction outer",
        "current_lat": 11.6643,
        "current_lng": 78.1460,
        "classes_available": ["1A", "2A", "3A", "SL"],
        "base_fares": {"1A": 2240.0, "2A": 1340.0, "3A": 960.0, "SL": 355.0},
        "runs_on_days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "base_delay_min": 5,
        "stops": [
            {"station_code": "MAS", "station_name": "MGR Chennai Central", "scheduled_arrival": "22:00", "scheduled_section_duration_min": 0, "platform": "10", "distance_km": 0},
            {"station_code": "AJJ", "station_name": "Arakkonam Jn", "scheduled_arrival": "22:58", "scheduled_section_duration_min": 58, "platform": "1", "distance_km": 69},
            {"station_code": "KPD", "station_name": "Katpadi Jn", "scheduled_arrival": "23:48", "scheduled_section_duration_min": 50, "platform": "1", "distance_km": 130},
            {"station_code": "JTJ", "station_name": "Jolarpettai Jn", "scheduled_arrival": "01:08", "scheduled_section_duration_min": 80, "platform": "2", "distance_km": 214},
            {"station_code": "SA", "station_name": "Salem Jn", "scheduled_arrival": "02:47", "scheduled_section_duration_min": 99, "platform": "1", "distance_km": 334},
            {"station_code": "ED", "station_name": "Erode Jn", "scheduled_arrival": "03:50", "scheduled_section_duration_min": 63, "platform": "2", "distance_km": 394},
            {"station_code": "TUP", "station_name": "Tiruppur", "scheduled_arrival": "04:38", "scheduled_section_duration_min": 48, "platform": "1", "distance_km": 444},
            {"station_code": "CBE", "station_name": "Coimbatore Jn", "scheduled_arrival": "06:00", "scheduled_section_duration_min": 82, "platform": "3", "distance_km": 497}
        ]
    },
    {
        "train_no": "12638",
        "train_name": "Pandian Superfast Express (MDU → MS)",
        "train_type": "Superfast Express",
        "source_station_code": "MDU",
        "source_station_name": "Madurai Jn",
        "dest_station_code": "MS",
        "dest_station_name": "Chennai Egmore",
        "departure_time": "21:35",
        "arrival_time": "05:10",
        "travel_time_hours": 7.6,
        "total_distance_km": 497.0,
        "current_speed": 98.0,
        "current_location_desc": "Crossing Tiruchchirappalli Junction",
        "current_lat": 10.7905,
        "current_lng": 78.7047,
        "classes_available": ["1A", "2A", "3A", "SL"],
        "base_fares": {"1A": 2240.0, "2A": 1340.0, "3A": 960.0, "SL": 355.0},
        "runs_on_days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "base_delay_min": 3,
        "stops": [
            {"station_code": "MDU", "station_name": "Madurai Jn", "scheduled_arrival": "21:35", "scheduled_section_duration_min": 0, "platform": "1", "distance_km": 0},
            {"station_code": "DG", "station_name": "Dindigul Jn", "scheduled_arrival": "22:33", "scheduled_section_duration_min": 58, "platform": "3", "distance_km": 62},
            {"station_code": "TPJ", "station_name": "Tiruchchirappalli Jn", "scheduled_arrival": "23:50", "scheduled_section_duration_min": 77, "platform": "1", "distance_km": 157},
            {"station_code": "VRI", "station_name": "Vriddhachalam Jn", "scheduled_arrival": "01:25", "scheduled_section_duration_min": 95, "platform": "3", "distance_km": 280},
            {"station_code": "VM", "station_name": "Villupuram Jn", "scheduled_arrival": "02:25", "scheduled_section_duration_min": 60, "platform": "1", "distance_km": 335},
            {"station_code": "CGL", "station_name": "Chengalpattu Jn", "scheduled_arrival": "03:53", "scheduled_section_duration_min": 88, "platform": "5", "distance_km": 438},
            {"station_code": "TBM", "station_name": "Tambaram", "scheduled_arrival": "04:23", "scheduled_section_duration_min": 30, "platform": "6", "distance_km": 469},
            {"station_code": "MS", "station_name": "Chennai Egmore", "scheduled_arrival": "05:10", "scheduled_section_duration_min": 47, "platform": "4", "distance_km": 497}
        ]
    }
]


class ETAService:
    """Combines Sensing, Physics+ML, Propagation, and Delivery for live train tracking."""

    def __init__(self):
        self.train_db: Dict[str, Dict[str, Any]] = {t["train_no"]: t for t in SAMPLE_TRAINS}

    def get_train_meta(self, train_no: str) -> Optional[Dict[str, Any]]:
        return self.train_db.get(train_no)

    def compute_live_train_eta(self, train_no: str, db: Optional[Session] = None) -> Optional[Dict[str, Any]]:
        train_data = self.get_train_meta(train_no)
        if not train_data:
            return None

        telemetry = sensing_service.get_latest_telemetry(train_no)
        current_delay = train_data.get("base_delay_min", 0)

        # Layer 2 Estimation for next section
        section_est = estimation_service.estimate_section(
            distance_km=45.0,
            telemetry=telemetry,
            current_delay_minutes=current_delay
        )

        # Layer 3 Delay Propagation across all remaining stops
        stops_propagated = propagation_service.propagate_delays(
            current_delay_minutes=current_delay,
            stops=train_data["stops"],
            current_stop_idx=min(2, len(train_data["stops"]) - 1)
        )

        # Layer 4 Delivery & Confidence interval calculation
        next_stop = stops_propagated[-1]
        conf = delivery_service.compute_confidence_range(
            base_eta_time_str=next_stop.get("estimated_eta", train_data["arrival_time"]),
            variance=section_est["uncertainty_variance"],
            distance_km=train_data["total_distance_km"]
        )

        explainability = delivery_service.generate_explainability(
            telemetry=telemetry,
            delay_minutes=current_delay,
            recovered_minutes=next_stop.get("recovered_minutes", 0),
            next_station=stops_propagated[min(2, len(stops_propagated) - 1)]["station_name"]
        )

        response = {
            "train_no": train_data["train_no"],
            "train_name": train_data["train_name"],
            "train_type": train_data["train_type"],
            "source_station_code": train_data["source_station_code"],
            "source_station_name": train_data["source_station_name"],
            "dest_station_code": train_data["dest_station_code"],
            "dest_station_name": train_data["dest_station_name"],
            "current_station_or_section": train_data.get("current_location_desc", "In Transit"),
            "current_speed_kmh": telemetry.current_speed_kmh,
            "current_lat": train_data.get("current_lat", 28.6139),
            "current_lng": train_data.get("current_lng", 77.2090),
            "overall_delay_minutes": current_delay,
            "confidence_low": conf["confidence_low"],
            "confidence_high": conf["confidence_high"],
            "confidence_range_str": conf["confidence_range_str"],
            "explainability_text": explainability,
            "last_updated": datetime.utcnow().strftime("%H:%M:%S UTC"),
            "stops": stops_propagated
        }

        # Cache in Redis
        redis_client.set_json(f"eta:train:{train_no}", response, ex=60)

        # Save snapshot in DB if session available
        if db:
            try:
                snapshot = ETASnapshot(
                    train_no=train_no,
                    station_code=train_data["dest_station_code"],
                    scheduled_arrival=train_data["arrival_time"],
                    estimated_eta=next_stop.get("estimated_eta", train_data["arrival_time"]),
                    delay_minutes=current_delay,
                    confidence_low=conf["confidence_low"],
                    confidence_high=conf["confidence_high"],
                    explainability_text=explainability,
                    speed_kmh=telemetry.current_speed_kmh,
                    status="ON_TIME" if current_delay <= 5 else "DELAYED"
                )
                db.add(snapshot)
                db.commit()
            except Exception:
                db.rollback()

        return response

    def get_station_live_board(self, station_code: str) -> Dict[str, Any]:
        station_code_upper = station_code.upper()
        matching_trains = []

        station_names = {
            "NDLS": "New Delhi",
            "MMCT": "Mumbai Central",
            "MAS": "MGR Chennai Central",
            "SBC": "KSR Bengaluru",
            "CBE": "Coimbatore Junction",
            "MDU": "Madurai Junction",
            "MS": "Chennai Egmore",
            "BSB": "Varanasi Junction",
            "BPL": "Bhopal Junction",
            "RKMP": "Rani Kamlapati",
            "AGC": "Agra Cantt",
            "CNB": "Kanpur Central",
            "KOTA": "Kota Junction",
            "ST": "Surat",
            "TVC": "Thiruvananthapuram Central",
            "HWH": "Howrah Junction",
            "HYB": "Hyderabad Deccan"
        }

        station_name = station_names.get(station_code_upper, f"{station_code_upper} Station")

        for train_no, train in self.train_db.items():
            for stop in train["stops"]:
                if stop["station_code"] == station_code_upper:
                    eta_info = self.compute_live_train_eta(train_no)
                    if not eta_info:
                        continue

                    # find this stop's ETA
                    stop_eta = next((s for s in eta_info["stops"] if s["station_code"] == station_code_upper), None)
                    scheduled = stop["scheduled_arrival"]
                    expected = stop_eta["estimated_eta"] if stop_eta and "estimated_eta" in stop_eta else scheduled
                    delay = stop_eta["delay_minutes"] if stop_eta else train.get("base_delay_min", 0)

                    conf = delivery_service.compute_confidence_range(expected, 1.2, 50.0)

                    matching_trains.append({
                        "train_no": train["train_no"],
                        "train_name": train["train_name"],
                        "train_type": train["train_type"],
                        "scheduled_time": scheduled,
                        "expected_time": expected,
                        "delay_minutes": delay,
                        "platform": stop.get("platform", "1"),
                        "direction": "DEPARTING" if train["source_station_code"] == station_code_upper else "ARRIVING",
                        "status": "ON_TIME" if delay <= 5 else "DELAYED",
                        "confidence_range": conf["confidence_range_str"],
                        "explainability_summary": eta_info["explainability_text"]
                    })

        return {
            "station_code": station_code_upper,
            "station_name": station_name,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "total_trains": len(matching_trains),
            "trains": matching_trains
        }


eta_service = ETAService()
