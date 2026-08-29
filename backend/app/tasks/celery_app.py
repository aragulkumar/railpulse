import os
from celery import Celery
from app.config import settings

celery_app = Celery(
    "railpulse_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_BROKER_URL,
    include=[
        "app.tasks.sos_routing",
        "app.tasks.notification_fanout",
        "app.tasks.eta_recompute"
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "recompute-eta-every-30s": {
            "task": "app.tasks.eta_recompute.recompute_all_train_etas",
            "schedule": 30.0,
        },
    }
)
