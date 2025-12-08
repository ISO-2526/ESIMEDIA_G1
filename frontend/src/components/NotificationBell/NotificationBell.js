import React, { useState, useEffect, useCallback } from 'react';
import './NotificationBell.css';
import NotificationDropdown from './NotificationDropdown';

/**
 * Componente NotificationBell - Badge de campana para notificaciones
 * Muestra contador de notificaciones no leídas y dropdown con lista
 */
const NotificationBell = ({ userId }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debug: log del userId
  useEffect(() => {
    console.log('[NotificationBell] userId:', userId);
  }, [userId]);

  // Función memoizada para cargar contador
  const fetchUnreadCount = useCallback(async () => {
    try {
      const url = `/api/notifications/unread/count?userId=${userId}`;
      console.log('[NotificationBell] GET', url);
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[NotificationBell] Unread count:', data.count);
        setUnreadCount(data.count);
      } else {
        console.error('[NotificationBell] Error response:', response.status);
      }
    } catch (error) {
      console.error('[NotificationBell] Error fetching unread count:', error);
    }
  }, [userId]);

  // Función memoizada para cargar notificaciones
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const url = `/api/notifications?userId=${userId}`;
      console.log('[NotificationBell] GET', url);
      const response = await fetch(url, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        console.log('[NotificationBell] Notifications:', data);
        setNotifications(data);
      } else {
        console.error('[NotificationBell] Error response:', response.status);
      }
    } catch (error) {
      console.error('[NotificationBell] Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Cargar contador de notificaciones no leídas
  useEffect(() => {
    if (userId) {
      console.log('[NotificationBell] Fetching unread count for userId:', userId);
      fetchUnreadCount();
      // Refrescar cada 30 segundos
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, fetchUnreadCount]);

  // Cargar notificaciones cuando se abre el dropdown
  useEffect(() => {
    if (showDropdown && userId) {
      fetchNotifications();
    }
  }, [showDropdown, userId, fetchNotifications]);



  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (response.ok) {
        fetchUnreadCount();
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        fetchUnreadCount();
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('¿Eliminar todas las notificaciones?')) {
      try {
        const response = await fetch(`/api/notifications?userId=${userId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        if (response.ok) {
          setUnreadCount(0);
          setNotifications([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error('Error deleting all notifications:', error);
      }
    }
  };

  // No renderizar si no hay userId
  if (!userId) {
    console.warn('[NotificationBell] userId is null or undefined');
    return null;
  }

  return (
    <div className="notification-bell-container">
      <button
        className="bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notificaciones"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="bell-icon"
        >
          <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
        </svg>
      </button>

      {unreadCount > 0 && (
        <span
          className="notification-badge"
          onClick={() => setShowDropdown(!showDropdown)}
          style={{ cursor: 'pointer' }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      {showDropdown && (
        <NotificationDropdown
          notifications={notifications}
          loading={loading}
          onMarkAsRead={handleMarkAsRead}
          onDelete={handleDelete}
          onDeleteAll={handleDeleteAll}
          onClose={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
