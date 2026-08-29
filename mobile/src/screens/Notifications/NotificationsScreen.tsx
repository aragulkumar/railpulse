import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { 
  Bell, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Tag, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

interface NotificationsScreenProps {
  onNavigate?: (screen: string) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifs();
  }, []);

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-slide-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#102A43' }}>
          Travel Alerts & Notifications
        </h2>
        <span style={{ fontSize: '12px', background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
          {notifications.filter((n) => !n.is_read).length} Unread
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {notifications.map((notif) => {
          const isDelay = notif.type === 'delay_alert';
          const isSOS = notif.type === 'sos_alert';

          return (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif.id)}
              className="glass-card"
              style={{
                padding: '14px 16px',
                borderLeft: `4px solid ${isSOS ? '#DC2626' : isDelay ? '#F59E0B' : '#16A34A'}`,
                background: notif.is_read ? '#FFFFFF' : '#FFFDF7',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isSOS ? (
                    <AlertTriangle size={16} color="#DC2626" />
                  ) : isDelay ? (
                    <Clock size={16} color="#D97706" />
                  ) : (
                    <CheckCircle2 size={16} color="#16A34A" />
                  )}
                  <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#102A43' }}>
                    {notif.title}
                  </h4>
                </div>

                {!notif.is_read && (
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                )}
              </div>

              <p style={{ fontSize: '13px', color: '#475569', marginTop: '6px', lineHeight: 1.4 }}>
                {notif.body}
              </p>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94A3B8' }}>
                <span>{new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span style={{ color: '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Tap to view <ExternalLink size={12} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
