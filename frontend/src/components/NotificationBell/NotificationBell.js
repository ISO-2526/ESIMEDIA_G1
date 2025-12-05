import React, { useState, useEffect } from 'react';
import { IonIcon, IonBadge } from '@ionic/react';
import { notificationsOutline } from 'ionicons/icons';
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

  // Cargar contador de notificaciones no leídas
  useEffect(() => {
    if (userId) {
      console.log('[NotificationBell] Fetching unread count for userId:', userId);
      fetchUnreadCount();
      // Refrescar cada 30 segundos
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Cargar notificaciones cuando se abre el dropdown
  useEffect(() => {
    if (showDropdown && userId) {
      fetchNotifications();
    }
  }, [showDropdown, userId]);

  const fetchUnreadCount = async () => {
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
  };

  const fetchNotifications = async () => {
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
  };

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
        <IonIcon icon={notificationsOutline} />
        {unreadCount > 0 && (
          <IonBadge className="notification-badge" color="danger">
            {unreadCount > 99 ? '99+' : unreadCount}
          </IonBadge>
        )}
      </button>

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
