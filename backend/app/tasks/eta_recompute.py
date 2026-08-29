import logging
from app.tasks.celery_app import celery_app
from app.services.eta_service import eta_service, SAMPLE_TRAINS
from app.core.redis_client import redis_client

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.eta_recompute.recompute_all_train_etas")
def recompute_all_train_etas():
    """
    Periodic background job: re-runs Layers 1–4 estimation for all active trains
    and refreshes the Redis confidence cache.
    """
    logger.info("[ETA RECOMPUTE] Running periodic re-estimation across all active train routes...")
    updated_count = 0
    for train in SAMPLE_TRAINS:
        train_no = train["train_no"]
        eta_data = eta_service.compute_live_train_eta(train_no)
        if eta_data:
            redis_client.publish(f"train:{train_no}:eta_update", eta_data)
            updated_count += 1
    return {"status": "ok", "recomputed_trains": updated_count}
