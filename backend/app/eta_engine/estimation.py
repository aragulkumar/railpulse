import math
from typing import Dict, Any, Tuple
from app.eta_engine.sensing import TelemetryFrame


class EstimationLayer:
    """Layer 2: Physics Kinematic Model + Machine Learning Blended Estimation."""

    def __init__(self):
        # Section speed limits (km/h) default
        self.default_section_mps = 110.0 / 3.6  # m/s
        self.max_acceleration = 0.45  # m/s^2 (Typical Electric Loco WAP-7 / Vande Bharat)
        self.service_deceleration = 0.55  # m/s^2

    def calculate_physics_runtime_minutes(
        self,
        distance_km: float,
        current_speed_kmh: float,
        target_speed_kmh: float,
        speed_restriction_kmh: float = 110.0,
        gradient_per_thousand: float = 0.0,
        signal_aspect: str = "GREEN"
    ) -> float:
        """Computes physics-based travel time over a section using kinematics."""
        if distance_km <= 0:
            return 0.0

        v_curr = current_speed_kmh / 3.6
        v_target = min(target_speed_kmh, speed_restriction_kmh) / 3.6

        # Signal slowdown factors
        if signal_aspect == "YELLOW":
            v_target = min(v_target, 30.0 / 3.6)
        elif signal_aspect == "DOUBLE_YELLOW":
            v_target = min(v_target, 60.0 / 3.6)
        elif signal_aspect == "RED":
            v_target = 0.0

        distance_m = distance_km * 1000.0

        # Acceleration / deceleration phase
        if v_curr < v_target:
            # Accelerating
            t_acc = (v_target - v_curr) / self.max_acceleration
            d_acc = (v_curr * t_acc) + (0.5 * self.max_acceleration * (t_acc ** 2))
        else:
            # Decelerating
            t_acc = (v_curr - v_target) / self.service_deceleration
            d_acc = (v_curr * t_acc) - (0.5 * self.service_deceleration * (t_acc ** 2))

        if d_acc >= distance_m:
            # Distance is too short to reach full target speed
            avg_v = max(1.0, (v_curr + v_target) / 2.0)
            total_seconds = distance_m / avg_v
        else:
            remaining_dist = distance_m - d_acc
            cruise_v = max(1.0, v_target)
            t_cruise = remaining_dist / cruise_v
            total_seconds = t_acc + t_cruise

        # Gradient penalty/bonus (1% gradient adds ~2.5% time)
        gradient_factor = 1.0 + (gradient_per_thousand * 0.0025)
        total_seconds *= max(0.9, gradient_factor)

        return max(0.5, total_seconds / 60.0)

    def calculate_ml_residual_minutes(
        self,
        telemetry: TelemetryFrame,
        historical_delay_minutes: int,
        hour_of_day: int = 14
    ) -> Tuple[float, float]:
        """Layer 2 ML residual estimator based on section features & headway."""
        residual = 0.0
        uncertainty_variance = 1.5

        # Headway conflict model
        if telemetry.preceding_train_headway_km < 4.0:
            # Close headway -> imminent caution signal delay
            residual += (4.0 - telemetry.preceding_train_headway_km) * 2.8
            uncertainty_variance += 3.0
        elif telemetry.preceding_train_headway_km < 8.0:
            residual += 1.2
            uncertainty_variance += 1.2

        # Weather / caution orders
        if telemetry.track_condition == "FOGGY":
            residual += 8.5
            uncertainty_variance += 5.0
        elif telemetry.track_condition == "CAUTION_ORDER":
            residual += 4.0
            uncertainty_variance += 2.0

        # Peak hours congestion factor (08:00-11:00 and 17:00-21:00)
        if 8 <= hour_of_day <= 11 or 17 <= hour_of_day <= 21:
            residual += 2.0
            uncertainty_variance += 1.5

        # Damped auto-regressive continuation of current delay
        residual += (historical_delay_minutes * 0.15)

        return residual, uncertainty_variance

    def estimate_section(
        self,
        distance_km: float,
        telemetry: TelemetryFrame,
        current_delay_minutes: int
    ) -> Dict[str, Any]:
        """Blends Physics kinematic model + ML residual."""
        physics_minutes = self.calculate_physics_runtime_minutes(
            distance_km=distance_km,
            current_speed_kmh=telemetry.current_speed_kmh,
            target_speed_kmh=120.0,
            speed_restriction_kmh=telemetry.temporary_speed_restriction_kmh or 120.0,
            gradient_per_thousand=telemetry.gradient_per_thousand,
            signal_aspect=telemetry.signal_aspect
        )

        ml_residual, variance = self.calculate_ml_residual_minutes(
            telemetry=telemetry,
            historical_delay_minutes=current_delay_minutes
        )

        estimated_duration = max(physics_minutes, physics_minutes + ml_residual)

        return {
            "physics_runtime_minutes": round(physics_minutes, 1),
            "ml_residual_minutes": round(ml_residual, 1),
            "estimated_duration_minutes": round(estimated_duration, 1),
            "uncertainty_variance": round(variance, 2)
        }


estimation_service = EstimationLayer()
