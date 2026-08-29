import pytest
from app.eta_engine.sensing import SensingLayer, TelemetryFrame
from app.eta_engine.estimation import EstimationLayer
from app.eta_engine.propagation import PropagationLayer
from app.eta_engine.delivery import DeliveryLayer


def test_sensing_layer_ingest_and_retrieve():
    sensing = SensingLayer()
    frame = TelemetryFrame(
        train_no="12951",
        timestamp=1000.0,
        current_lat=28.6139,
        current_lng=77.2090,
        current_speed_kmh=110.0,
        current_block_section="SEC-01",
        signal_aspect="GREEN",
        gradient_per_thousand=0.0,
        track_condition="DRY",
        temporary_speed_restriction_kmh=None,
        preceding_train_headway_km=12.0
    )
    sensing.ingest_frame(frame)
    retrieved = sensing.get_latest_telemetry("12951")
    assert retrieved.train_no == "12951"
    assert retrieved.current_speed_kmh == 110.0


def test_physics_kinematic_estimation():
    estimation = EstimationLayer()
    # 50km at 120km/h should take approx 25 minutes
    runtime = estimation.calculate_physics_runtime_minutes(
        distance_km=50.0,
        current_speed_kmh=120.0,
        target_speed_kmh=120.0,
        speed_restriction_kmh=120.0,
        signal_aspect="GREEN"
    )
    assert 20.0 <= runtime <= 30.0


def test_delay_propagation_with_slack():
    propagation = PropagationLayer()
    stops = [
        {"station_code": "NDLS", "scheduled_arrival": "06:00", "scheduled_section_duration_min": 0},
        {"station_code": "CNB", "scheduled_arrival": "10:00", "scheduled_section_duration_min": 240},
        {"station_code": "BSB", "scheduled_arrival": "14:00", "scheduled_section_duration_min": 240}
    ]
    # Train is delayed 20 mins at origin
    propagated = propagation.propagate_delays(current_delay_minutes=20, stops=stops, current_stop_idx=0)
    assert len(propagated) == 3
    # Downstream station should absorb slack and have lower or equal delay
    assert propagated[-1]["delay_minutes"] <= 20


def test_delivery_explainability_and_confidence():
    delivery = DeliveryLayer()
    telemetry = TelemetryFrame(
        train_no="12951",
        timestamp=1000.0,
        current_lat=28.6139,
        current_lng=77.2090,
        current_speed_kmh=75.0,
        current_block_section="SEC-02",
        signal_aspect="YELLOW",
        gradient_per_thousand=0.0,
        track_condition="CAUTION_ORDER",
        temporary_speed_restriction_kmh=60.0,
        preceding_train_headway_km=3.2
    )

    conf = delivery.compute_confidence_range("14:30", variance=2.5, distance_km=100.0)
    assert "–" in conf["confidence_range_str"]

    explain = delivery.generate_explainability(
        telemetry=telemetry,
        delay_minutes=15,
        recovered_minutes=4.0,
        next_station="Mathura Jn"
    )
    assert "Delayed by 15 mins" in explain
    assert "freight" in explain or "caution" in explain or "speed" in explain
