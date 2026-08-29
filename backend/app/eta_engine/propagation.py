from typing import List, Dict, Any
from datetime import datetime, timedelta


class PropagationLayer:
    """Layer 3: Network Delay Propagation & Slack Buffer Recovery."""

    def __init__(self):
        # Slack recovery capability: typical IR rake can make up ~15-20% of section buffer
        self.recovery_rate = 0.18

    def propagate_delays(
        self,
        current_delay_minutes: int,
        stops: List[Dict[str, Any]],
        current_stop_idx: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Propagates delay through downstream stations with realistic slack absorption.
        """
        propagated_stops = []
        running_delay = float(current_delay_minutes)

        for idx, stop in enumerate(stops):
            if idx < current_stop_idx:
                # Already passed
                propagated_stops.append({
                    **stop,
                    "delay_minutes": stop.get("delay_minutes", 0),
                    "status": "PASSED"
                })
                continue
            elif idx == current_stop_idx:
                # Current station / section
                status = "CURRENT" if running_delay == 0 else "DELAYED"
                propagated_stops.append({
                    **stop,
                    "delay_minutes": int(running_delay),
                    "status": status
                })
                continue

            # Downstream stations: attempt slack buffer recovery
            scheduled_section_time = stop.get("scheduled_section_duration_min", 45)
            potential_recovery = min(running_delay, scheduled_section_time * self.recovery_rate)
            
            # Delay can recover slightly over long sections
            running_delay = max(0.0, running_delay - potential_recovery)

            # Compute estimated time string based on scheduled time + running delay
            scheduled_arrival_str = stop.get("scheduled_arrival", "12:00")
            try:
                base_time = datetime.strptime(scheduled_arrival_str, "%H:%M")
                est_time = base_time + timedelta(minutes=int(running_delay))
                estimated_arrival_str = est_time.strftime("%H:%M")
            except Exception:
                estimated_arrival_str = scheduled_arrival_str

            status = "ON_TIME" if int(running_delay) <= 5 else "DELAYED"

            propagated_stops.append({
                **stop,
                "estimated_eta": estimated_arrival_str,
                "delay_minutes": int(running_delay),
                "recovered_minutes": round(potential_recovery, 1),
                "status": status
            })

        return propagated_stops


propagation_service = PropagationLayer()
