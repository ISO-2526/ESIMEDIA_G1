import React, { useState, useEffect } from 'react';
import { 
  IonIcon,
  IonPopover
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
  homeOutline
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import MobileFilterModal from './MobileFilterModal';
import NotificationItem from '../NotificationItem';
import { useNotifications } from '../../hooks/useNotifications';
import logo from '../../resources/esimedialogo.png';
import './MobileHeader.css';

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
  const [scrollPosition, setScrollPosition] = useState(0);
  const history = useHistory();
  const location = useLocation();

  // Usar el hook de notificaciones centralizado
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    handleNotificationClick 
  } = useNotifications();

  // Resetear el error de imagen cuando cambia el userProfile
  useEffect(() => {
    setImageError(false);
  }, [userProfile?.picture]);

  // Cerrar todos los menús al cambiar de página
  useEffect(() => {
    setIsMenuOpen(false);
    setIsFilterOpen(false);
    setIsNotificationsOpen(false);
    setShowSearch(false);
    if (setSearchQuery) {
      setSearchQuery('');
    }
  }, [location.pathname, setSearchQuery]);

  // Prevenir scroll cuando se abren los menus
  useEffect(() => {
    if (isMenuOpen || isFilterOpen || isNotificationsOpen) {
      // Guardar posición actual del scroll
      const currentScrollY = window.scrollY;
      setScrollPosition(currentScrollY);
      
      // Bloquear scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${currentScrollY}px`;
      document.body.style.width = '100%';
    } else {
      // Restaurar scroll cuando se cierran los menús
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      // Restaurar posición del scroll
      window.scrollTo(0, scrollPosition);
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isMenuOpen, isFilterOpen, isNotificationsOpen, scrollPosition]);

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
              onClick={(e) => {
                e.preventDefault();
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
              className="mobile-icon-btn notification-btn"
              onClick={(e) => {
                e.preventDefault();
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsMenuOpen(false);
                setIsFilterOpen(false);
              }}
            >
              <IonIcon icon={notificationsOutline} />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>
          )}

          {/* Avatar con menú - se oculta cuando búsqueda está activa */}
          {!showSearch && (
            <button 
              className="mobile-icon-btn avatar-button" 
              id="user-menu-trigger"
              onClick={(e) => {
                e.preventDefault();
                setIsMenuOpen(!isMenuOpen);
                setIsFilterOpen(false);
                setIsNotificationsOpen(false);
              }}
            >
              <div className="mobile-avatar" style={{ position: 'relative' }}>
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
                {userProfile?.vip && (
                  <div style={{
                    position: 'absolute',
                    top: '-5px',
                    right: '-5px',
                    background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(255, 193, 7, 0.6)',
                    border: '2px solid #1a1a2e',
                    zIndex: 9999
                  }}>
                    <i className="fas fa-crown" style={{ color: '#1a1a2e', fontSize: '10px' }}></i>
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
              history.push('/usuario');
            }}
          >
            <IonIcon icon={homeOutline} />
            <span>Inicio</span>
          </button>

          <button
            className="user-menu-button"
            onClick={() => {
              setIsMenuOpen(false);
              history.push('/perfil');
            }}
          >
            <IonIcon icon={person} />
            <span>Mi Perfil</span>
          </button>

          <button
            className="user-menu-button"
            onClick={() => {
              setIsMenuOpen(false);
              history.push('/playlists');
            }}
          >
            <IonIcon icon={listOutline} />
            <span>Mis Listas</span>
          </button>

          <button
            className="user-menu-button"
            onClick={() => {
              setIsMenuOpen(false);
              history.push('/suscripcion');
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
          </div>
          <div className="notifications-list">
            {loading ? (
              <div className="notifications-loading">
                <p>Cargando notificaciones...</p>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => {
                    handleNotificationClick(notification);
                    setIsNotificationsOpen(false);
                  }}
                  onMarkAsRead={markAsRead}
                />
              ))
            ) : (
              <div className="no-notifications">
                <IonIcon icon={notificationsOutline} />
                <p>No tienes notificaciones nuevas</p>
              </div>
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
