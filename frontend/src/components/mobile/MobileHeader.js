import React, { useState, useEffect, useCallback } from 'react';
import {
  IonIcon,
  IonPopover,
  IonSpinner
} from '@ionic/react';
import {
  searchOutline,
  filterOutline,
  notificationsOutline,
  listOutline,
  cardOutline,
  logOutOutline,
  closeOutline,
  person,
  informationCircle,
  warning,
  alertCircle,
  checkmarkCircle,
  trashOutline
} from 'ionicons/icons';
import useNavigate from '../../hooks/useNavigate';
import MobileFilterModal from './MobileFilterModal';
import logo from '../../resources/esimedialogo.png';
import './MobileHeader.css';
import axiosInstance from '../../api/axiosConfig';

const MobileHeader = ({
  userProfile,
  searchQuery,
  setSearchQuery,
  handleLogout,
  currentFilters,
  onFiltersChange,
  showSearch: showSearchProp = false, // Mostrar búsqueda (opcional)
  showFilters: showFiltersProp = false, // Mostrar filtros (opcional)
  showNotifications: showNotificationsProp = true // Mostrar notificaciones (opcional, por defecto true)
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { navigate } = useNavigate();

  // Estado para notificaciones
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Obtener userId del perfil del usuario
  const userId = userProfile?.email;

  // Función para cargar notificaciones
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    setLoadingNotifications(true);
    try {
      const response = await axiosInstance.get(`/api/notifications?userId=${encodeURIComponent(userId)}`);
      if (response.data) {
        setNotifications(response.data);
        // Contar no leídas
        const unread = response.data.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('[MobileHeader] Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, [userId]);

  // Función para obtener solo el contador de no leídas
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await axiosInstance.get(`/api/notifications/unread/count?userId=${encodeURIComponent(userId)}`);
      if (response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('[MobileHeader] Error fetching unread count:', error);
    }
  }, [userId]);

  // Cargar contador de notificaciones al montar y cada 30 segundos
  useEffect(() => {
    if (userId) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userId, fetchUnreadCount]);

  // Cargar notificaciones cuando se abre el popover
  useEffect(() => {
    if (isNotificationsOpen && userId) {
      fetchNotifications();
    }
  }, [isNotificationsOpen, userId, fetchNotifications]);

  // Marcar notificación como leída
  const handleMarkAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/api/notifications/${notificationId}/read`);
      // Actualizar estado local
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[MobileHeader] Error marking notification as read:', error);
    }
  };

  // Eliminar notificación
  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await axiosInstance.delete(`/api/notifications/${notificationId}`);
      // Actualizar estado local
      const removed = notifications.find(n => n.id === notificationId);
      if (removed && !removed.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('[MobileHeader] Error deleting notification:', error);
    }
  };

  // Obtener icono según tipo de notificación
  const getNotificationIcon = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS':
        return checkmarkCircle;
      case 'WARNING':
        return warning;
      case 'ERROR':
        return alertCircle;
      case 'INFO':
      default:
        return informationCircle;
    }
  };

  // Obtener color según tipo de notificación
  const getNotificationColor = (type) => {
    switch (type?.toUpperCase()) {
      case 'SUCCESS':
        return '#4ade80';
      case 'WARNING':
        return '#FAED5C';
      case 'ERROR':
        return '#ef4444';
      case 'INFO':
      default:
        return '#4F56BA';
    }
  };

  // Formatear fecha relativa
  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // Prevenir scroll cuando se abren los menus
  useEffect(() => {
    if (isMenuOpen || isFilterOpen || isNotificationsOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [isMenuOpen, isFilterOpen, isNotificationsOpen]);

  return (
    <div className={`mobile-header-ionic ${showSearch ? 'search-expanded' : ''}`}>
      <div className="mobile-toolbar">
        {/* Logo - se oculta cuando búsqueda está activa */}
        {!showSearch && (
          <div className="mobile-logo-container">
            <img src={logo} alt="ESIMEDIA" className="mobile-logo" />
          </div>
        )}

        {/* Buscador expandible - solo si showSearchProp es true */}
        {showSearchProp && showSearch ? (
          <div className="mobile-searchbar-container">
            {/* Icono de búsqueda */}
            <div className="mobile-search-icon">
              <IonIcon icon={searchOutline} />
            </div>

            {/* Input nativo */}
            <input
              type="text"
              className="mobile-search-input"
              placeholder="Buscar contenido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />

            {/* Botón cerrar búsqueda */}
            {searchQuery && (
              <button
                className="mobile-search-clear"
                onClick={() => setSearchQuery('')}
              >
                <IonIcon icon={closeOutline} />
              </button>
            )}
          </div>
        ) : null}

        {/* Botones de acción */}
        <div className="mobile-action-buttons">
          {/* Búsqueda - solo si showSearchProp es true */}
          {showSearchProp && !showSearch && (
            <button className="mobile-icon-btn" onClick={() => setShowSearch(true)}>
              <IonIcon icon={searchOutline} />
            </button>
          )}

          {/* Filtros - solo si showFiltersProp es true */}
          {showFiltersProp && (
            <button
              id="filter-menu-trigger"
              className="mobile-icon-btn"
              onClick={() => {
                setIsFilterOpen(!isFilterOpen);
                setIsMenuOpen(false);
                setIsNotificationsOpen(false);
              }}
            >
              <IonIcon icon={filterOutline} />
            </button>
          )}

          {/* Notificaciones - solo si showNotificationsProp es true y búsqueda no está activa */}
          {showNotificationsProp && !showSearch && (
            <button
              id="notifications-menu-trigger"
              className="mobile-icon-btn notification-btn-container"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsMenuOpen(false);
                setIsFilterOpen(false);
              }}
            >
              <IonIcon icon={notificationsOutline} />
              {unreadCount > 0 && (
                <span className="mobile-notification-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Avatar con menú - se oculta cuando búsqueda está activa */}
          {!showSearch && (
            <button
              className="mobile-icon-btn avatar-button"
              id="user-menu-trigger"
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                setIsFilterOpen(false);
                setIsNotificationsOpen(false);
              }}
            >
              <div className="mobile-avatar">
                {userProfile?.picture && !imageError ? (
                  <img
                    src={userProfile.picture}
                    alt="Avatar"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <IonIcon icon={person} />
                  </div>
                )}
              </div>
            </button>
          )}

          {/* Botón para cerrar búsqueda */}
          {showSearchProp && showSearch && (
            <button
              className="mobile-icon-btn"
              onClick={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
            >
              <IonIcon icon={closeOutline} />
            </button>
          )}
        </div>
      </div>

      {/* Popover del menú de usuario */}
      <IonPopover
        trigger="user-menu-trigger"
        reference="trigger"
        side="bottom"
        alignment="end"
        isOpen={isMenuOpen}
        onDidDismiss={() => setIsMenuOpen(false)}
        arrow={false}
        className="user-menu-popover"
      >
        <div className="user-menu-content">
          <button
            className="user-menu-button"
            onClick={() => {
              setIsMenuOpen(false);
              navigate('/perfil');
            }}
          >
            <IonIcon icon={person} />
            <span>Mi Perfil</span>
          </button>

          <button
            className="user-menu-button"
            onClick={() => {
              setIsMenuOpen(false);
              navigate('/playlists');
            }}
          >
            <IonIcon icon={listOutline} />
            <span>Mis Listas</span>
          </button>

          <button
            className="user-menu-button"
            onClick={() => {
              setIsMenuOpen(false);
              navigate('/suscripcion');
            }}
          >
            <IonIcon icon={cardOutline} />
            <span>Suscripción</span>
          </button>

          <button
            className="user-menu-button logout-button"
            onClick={() => {
              setIsMenuOpen(false);
              handleLogout();
            }}
          >
            <IonIcon icon={logOutOutline} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </IonPopover>

      {/* Popover de notificaciones */}
      <IonPopover
        trigger="notifications-menu-trigger"
        reference="trigger"
        side="bottom"
        alignment="end"
        isOpen={isNotificationsOpen}
        onDidDismiss={() => setIsNotificationsOpen(false)}
        arrow={false}
        className="notifications-popover"
      >
        <div className="notifications-content">
          <div className="notifications-header">
            <h3>Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="notifications-count">{unreadCount} nuevas</span>
            )}
          </div>
          <div className="notifications-list">
            {loadingNotifications ? (
              <div className="notifications-loading">
                <IonSpinner name="crescent" />
                <p>Cargando notificaciones...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">
                <IonIcon icon={notificationsOutline} />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                >
                  <div
                    className="notification-icon"
                    style={{ color: getNotificationColor(notification.type) }}
                  >
                    <IonIcon icon={getNotificationIcon(notification.type)} />
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">{notification.title}</p>
                    <p className="notification-message">{notification.message}</p>
                    <p className="notification-time">{formatTimeAgo(notification.createdAt)}</p>
                  </div>
                  {!notification.read && <div className="notification-badge"></div>}
                  <button
                    className="notification-delete-btn"
                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                  >
                    <IonIcon icon={trashOutline} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </IonPopover>

      {/* Modal de filtros - solo si showFiltersProp es true */}
      {showFiltersProp && (
        <MobileFilterModal
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          currentFilters={currentFilters}
          onApplyFilters={onFiltersChange}
        />
      )}
    </div>
  );
};

export default MobileHeader;

