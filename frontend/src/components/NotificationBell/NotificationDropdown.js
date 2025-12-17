import React from 'react';
import PropTypes from 'prop-types';
import { IonIcon } from '@ionic/react';
import { trash, checkmark } from 'ionicons/icons';
import axios from '../../api/axiosConfig';
import { transformContent } from '../../utils/contentUtils';
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

  const handleNotificationClick = async (notification) => {
    // Si la notificación tiene contentId, cargar y mostrar el contenido
    if (notification.contentId) {
      try {
        
        // Marcar como leída si no lo está (pero no bloquear la reproducción)
        if (!notification.read) {
          onMarkAsRead(notification.id);
        }
        
        // Cargar el contenido completo desde el backend usando axios
        const response = await axios.get(`/api/public/contents/${notification.contentId}`);
        const rawContent = response.data;
        
        // Transformar el contenido al formato esperado por el player
        const content = transformContent(rawContent);
        
        // Disparar evento personalizado para que el dashboard lo capture
        window.dispatchEvent(new CustomEvent('playContentFromNotification', { 
          detail: { content },
          bubbles: true,
          cancelable: true
        }));
        
        // 🔧 IMPORTANTE: En móvil, agregar un pequeño delay antes de cerrar
        // para asegurar que el evento se procese
        setTimeout(() => {
          onClose();
        }, 100);
        
      } catch (error) {
        console.error('[NotificationDropdown] Error al cargar contenido:', error);
        console.error('[NotificationDropdown] Error stack:', error.stack);
      }
    } else {
      console.log('[NotificationDropdown] Notification has no contentId');
    }
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
                className={`notification-item ${notification.read ? 'read' : 'unread'} ${notification.contentId ? 'clickable' : ''}`}
              >
                <div className={`notification-type-indicator ${getNotificationTypeColor(notification.type)}`} />
                <button 
                  className="notification-content"
                  onClick={() => handleNotificationClick(notification)}
                  style={{ cursor: notification.contentId ? 'pointer' : 'default' }}
                  disabled={!notification.contentId}
                >
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{formatDate(notification.createdAt)}</div>
                </button>
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

NotificationDropdown.propTypes = {
  notifications: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    read: PropTypes.bool.isRequired,
    contentId: PropTypes.number,
    type: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired
  })).isRequired,
  loading: PropTypes.bool.isRequired,
  onMarkAsRead: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDeleteAll: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default NotificationDropdown;
