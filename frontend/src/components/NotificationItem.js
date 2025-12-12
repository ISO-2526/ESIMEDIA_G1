import React from 'react';
import { IonIcon } from '@ionic/react';
import {
  notificationsOutline,
  musicalNotesOutline,
  videocamOutline,
  listOutline,
  informationCircleOutline,
  starOutline
} from 'ionicons/icons';

const NotificationItem = ({ notification, onClick, onMarkAsRead, onRemove }) => {
  // Iconos según el tipo de notificación
  const getNotificationIcon = (type) => {
    const icons = {
      content: videocamOutline,
      audio: musicalNotesOutline,
      video: videocamOutline,
      playlist: listOutline,
      recommendation: starOutline,
      system: informationCircleOutline
    };
    return icons[type] || notificationsOutline;
  };

  // Colores según el tipo
  const getNotificationColor = (type) => {
    const colors = {
      content: '#4F56BA',
      audio: '#FF6B6B',
      video: '#4ECDC4',
      playlist: '#45B7D1',
      recommendation: '#FFA07A',
      system: '#98D8C8'
    };
    return colors[type] || '#4F56BA';
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;

    return time.toLocaleDateString();
  };

  return (
    <div
      className={`notification-item ${!notification.read ? 'unread' : ''}`}
      onClick={() => onClick(notification)}
      style={{
        cursor: notification.contentId ? 'pointer' : 'default'
      }}
    >
      <div
        className="notification-icon"
        style={{
          backgroundColor: `${getNotificationColor(notification.type)}20`,
          border: `1px solid ${getNotificationColor(notification.type)}40`
        }}
      >
        <IonIcon
          icon={getNotificationIcon(notification.type)}
          style={{ color: getNotificationColor(notification.type) }}
        />
      </div>

      <div className="notification-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h4 className="notification-title">{notification.title}</h4>
          {!notification.read && (
            <div
              className="notification-badge"
              title="No leída"
            />
          )}
        </div>

        <p className="notification-message">{notification.message}</p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="notification-time">
            {formatTime(notification.timestamp)}
          </span>

          {notification.contentId && (
            <span style={{
              fontSize: '12px',
              color: getNotificationColor(notification.type),
              fontWeight: '500'
            }}>
              Ver contenido →
            </span>
          )}
        </div>
      </div>

      {/* Botón para marcar como leída (opcional) */}
      {!notification.read && (
        <button
          className="notification-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onMarkAsRead(notification.id);
          }}
          title="Marcar como leída"
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default NotificationItem;