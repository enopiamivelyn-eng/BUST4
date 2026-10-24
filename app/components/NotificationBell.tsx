'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useLiveDatabaseRefresh } from './useLiveDatabaseRefresh';

interface AppNotification {
  id: number;
  actor_id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', { credentials: 'include', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load notifications.');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load notifications.');
    }
  }, []);

  useLiveDatabaseRefresh(() => { void loadNotifications(); });

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 30000);
    return () => window.clearInterval(interval);
  }, [loadNotifications]);

  const markRead = async () => {
    if (!unreadCount) return;
    try {
      await fetch('/api/notifications', { method: 'PATCH', credentials: 'include' });
      setUnreadCount(0);
      setNotifications((current) => current.map((notification) => ({ ...notification, read_at: notification.read_at || new Date().toISOString() })));
    } catch {
      // Keep the bell count if the read receipt could not be saved.
    }
  };

  return (
    <div className="ds-notification-wrap">
      <button
        type="button"
        className="ds-bell"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-controls="ds-notification-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="21" height="21" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 8a4 4 0 1 1 8 0c0 3 1.2 4.2 1.2 4.2H4.8S6 11 6 8Z" />
          <path d="M8.5 15a1.6 1.6 0 0 0 3 0" />
        </svg>
        {unreadCount > 0 && <span className="ds-bell-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <section className="ds-notification-panel" id="ds-notification-panel" aria-label="Notifications">
          <div className="ds-notification-head">
            <strong>Notifications</strong>
            {unreadCount > 0 && <button type="button" onClick={markRead}>Mark all read</button>}
          </div>
          {error ? <p className="ds-notification-empty">{error}</p> : notifications.length === 0 ? (
            <p className="ds-notification-empty">You’re all caught up.</p>
          ) : (
            <ul className="ds-notification-list">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <Link href="/messages" className={!notification.read_at ? 'is-unread' : ''} onClick={markRead}>
                    <strong>{notification.title}</strong>
                    <span>{notification.body}</span>
                    <time dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleString()}</time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/messages" className="ds-notification-footer" onClick={() => setOpen(false)}>Open messages</Link>
        </section>
      )}
    </div>
  );
}
