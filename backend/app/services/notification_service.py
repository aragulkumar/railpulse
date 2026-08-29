from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.notification import Notification


class NotificationService:
    def list_notifications(self, user_id: int, db: Session) -> List[Notification]:
        notifs = db.query(Notification).filter(Notification.user_id == user_id).order_by(Notification.created_at.desc()).all()
        if not notifs:
            # Seed initial friendly notifications
            demo_notifs = [
                Notification(
                    user_id=user_id,
                    type="delay_alert",
                    title="12951 Mumbai Rajdhani Running 14m Late",
                    body="Physics+ML engine detected freight clearance delay near Mathura. Recovery expected in Agra section.",
                    deep_link="/eta/12951",
                    is_read=False,
                    created_at=datetime.utcnow()
                ),
                Notification(
                    user_id=user_id,
                    type="platform_change",
                    title="Platform Allocated: Platform #3",
                    body="Train 12951 will arrive on Platform #3 at Kota Junction.",
                    deep_link="/eta/12951",
                    is_read=False,
                    created_at=datetime.utcnow()
                ),
                Notification(
                    user_id=user_id,
                    type="booking",
                    title="Booking Confirmed: PNR 8421950341",
                    body="Coach B2, Berth 45 (Upper) confirmed for Mumbai Rajdhani on 2026-09-02.",
                    deep_link="/booking/pnr/8421950341",
                    is_read=True,
                    created_at=datetime.utcnow()
                )
            ]
            for n in demo_notifs:
                db.add(n)
            db.commit()
            return demo_notifs
        return notifs

    def mark_read(self, notif_id: int, user_id: int, db: Session) -> Optional[Notification]:
        notif = db.query(Notification).filter(Notification.id == notif_id).first()
        if notif:
            notif.is_read = True
            db.commit()
            db.refresh(notif)
        return notif


notification_service = NotificationService()
