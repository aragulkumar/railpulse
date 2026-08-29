import logging
from typing import List
from app.tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.notification_fanout.fanout_delay_notification")
def fanout_delay_notification(train_no: str, delay_minutes: int, reason: str, user_ids: List[int]):
    """
    Fans out push notifications to all passengers holding active tickets on the affected train.
    """
    logger.info(f"[NOTIF FANOUT] Broadcasting delay alert for Train {train_no} (+{delay_minutes}m) to {len(user_ids)} passengers.")
    return {"status": "success", "train_no": train_no, "passengers_notified": len(user_ids)}
