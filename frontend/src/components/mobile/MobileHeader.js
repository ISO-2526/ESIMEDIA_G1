import React, { useState } from 'react';
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
  person
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import MobileFilterModal from './MobileFilterModal';
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
  const history = useHistory();

  // Prevenir scroll cuando se abren los menus
  React.useEffect(() => {
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
              className="mobile-icon-btn"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsMenuOpen(false);
                setIsFilterOpen(false);
              }}
            >
              <IonIcon icon={notificationsOutline} />
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
            {/* Mensaje cuando no hay notificaciones */}
            <div className="no-notifications">
              <IonIcon icon={notificationsOutline} />
              <p>No tienes notificaciones nuevas</p>
            </div>
            {/* Aquí se cargarán las notificaciones dinámicamente */}
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
