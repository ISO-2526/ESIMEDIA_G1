import React from 'react';
import { IonIcon } from '@ionic/react';
import { trash, checkmark } from 'ionicons/icons';
import './NotificationDropdown.css';

/**
 * Componente NotificationDropdown - Lista de notificaciones
 */
const NotificationDropdown = ({
  notifications,
  loading,
  onMarkAsRead,
  onDelete,
  onDeleteAll,
  onClose
}) => {
  const getNotificationTypeColor = (type) => {
    switch (type) {
      case 'INFO':
        return 'info';
      case 'WARNING':
        return 'warning';
      case 'ERROR':
        return 'danger';
      case 'SUCCESS':
        return 'success';
      default:
        return 'medium';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('es-ES');
  };

  return (
    <div className="notification-dropdown">
      <div className="dropdown-header">
        <h3>Notificaciones</h3>
        {notifications.length > 0 && (
          <button
            className="delete-all-btn"
            onClick={onDeleteAll}
            title="Eliminar todas"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="dropdown-content">
        {loading && <div className="loading">Cargando...</div>}

        {!loading && notifications.length === 0 && (
          <div className="empty-state">
            <p>No hay notificaciones</p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <ul className="notifications-list">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              >
                <div className={`notification-type-indicator ${getNotificationTypeColor(notification.type)}`} />
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{formatDate(notification.createdAt)}</div>
                </div>
                <div className="notification-actions">
                  {!notification.read && (
                    <button
                      className="action-btn mark-read"
                      onClick={() => onMarkAsRead(notification.id)}
                      title="Marcar como leída"
                    >
                      <IonIcon icon={checkmark} />
                    </button>
                  )}
                  <button
                    className="action-btn delete"
                    onClick={() => onDelete(notification.id)}
                    title="Eliminar"
                  >
                    <IonIcon icon={trash} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dropdown-footer">
        <button className="close-btn" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
