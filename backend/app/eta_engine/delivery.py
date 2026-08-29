from datetime import datetime, timedelta
from typing import Dict, Any, List
from app.eta_engine.sensing import TelemetryFrame


class DeliveryLayer:
    """Layer 4: Delivery, Confidence Band Calculator & Explainability Engine."""

    def compute_confidence_range(
        self,
        base_eta_time_str: str,
        variance: float,
        distance_km: float
    ) -> Dict[str, str]:
        """
        Calculates Lower and Upper confidence ETA bounds based on section variance
        and remaining distance uncertainty.
        """
        try:
            base_time = datetime.strptime(base_eta_time_str, "%H:%M")
        except Exception:
            base_time = datetime.now()

        # Uncertainty delta grows slightly with distance
        distance_uncertainty = max(1.0, distance_km * 0.015)
        total_delta_min = max(2.0, variance + distance_uncertainty)

        low_time = base_time - timedelta(minutes=int(total_delta_min * 0.4))
        high_time = base_time + timedelta(minutes=int(total_delta_min * 0.6))

        return {
            "confidence_low": low_time.strftime("%H:%M"),
            "confidence_high": high_time.strftime("%H:%M"),
            "confidence_range_str": f"{low_time.strftime('%H:%M')} – {high_time.strftime('%H:%M')}"
        }

    def generate_explainability(
        self,
        telemetry: TelemetryFrame,
        delay_minutes: int,
        recovered_minutes: float,
        next_station: str
    ) -> str:
        """
        Synthesizes a clear, transparent explanation for passengers & TTEs
        explaining why there is a delay or how time is being recovered.
        """
        if delay_minutes <= 3:
            return f"Train is running on-time at {int(telemetry.current_speed_kmh)} km/h. Clear block signals ahead approaching {next_station}."

        reasons = []
        if telemetry.preceding_train_headway_km < 5.0:
            reasons.append(f"freight traffic regulation ({telemetry.preceding_train_headway_km:.1f} km headway)")
        if telemetry.signal_aspect in ["YELLOW", "DOUBLE_YELLOW"]:
            reasons.append("caution speed aspect on approaching interlocking")
        if telemetry.track_condition == "CAUTION_ORDER":
            reasons.append(f"engineering speed restriction of {int(telemetry.temporary_speed_restriction_kmh or 45)} km/h")
        if telemetry.track_condition == "FOGGY":
            reasons.append("reduced visibility fog protocol")

        if not reasons:
            reasons.append("section line congestion and platform turnaround delay")

        reason_str = " and ".join(reasons)
        recovery_str = f" Expected to recover ~{int(recovered_minutes)} mins in next section." if recovered_minutes > 1 else ""

        return f"Delayed by {delay_minutes} mins due to {reason_str}.{recovery_str}"


delivery_service = DeliveryLayer()
