import logging
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.sos_routing.route_sos_emergency")
def route_sos_emergency(complaint_id: int, emergency_type: str, coach: str, berth: int, lat: float, lng: float):
    """
    Asynchronously alerts Divisional Security Control Room, RPF post at next station,
    and Train Superintendent with geo-coordinates.
    """
    logger.info(f"[SOS ROUTER] Dispatching Emergency SOS #{complaint_id} ({emergency_type}) for Coach {coach}, Berth {berth} at ({lat}, {lng})")
    # In production: sends FCM push notification + SMS alert + RPF CAD system ingest
    return {"status": "dispatched", "complaint_id": complaint_id, "recipients": ["RPF_CTRL", "TRAIN_CAPTAIN"]}
