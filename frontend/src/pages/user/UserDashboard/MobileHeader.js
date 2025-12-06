import React, { useState } from 'react';
import { 
  IonIcon,
  IonPopover
} from '@ionic/react';
import { 
  searchOutline, 
  filterOutline, 
  personCircleOutline,
  listOutline,
  cardOutline,
  logOutOutline,
  closeOutline,
  person
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import MobileFilterModal from '../../../components/mobile/MobileFilterModal';
import logo from '../../../resources/esimedialogo.png';
import './MobileHeader.css';

const MobileHeader = ({ 
  userProfile, 
  searchQuery, 
  setSearchQuery,
  handleLogout,
  currentFilters,
  onFiltersChange
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const history = useHistory();

  // Prevenir scroll cuando se abren los menus
  React.useEffect(() => {
    if (isMenuOpen || isFilterOpen) {
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
  }, [isMenuOpen, isFilterOpen]);

  return (
    <div className={`mobile-header-ionic ${showSearch ? 'search-expanded' : ''}`}>
      <div className="mobile-toolbar">
        {/* Logo - se oculta cuando búsqueda está activa */}
        {!showSearch && (
          <div className="mobile-logo-container">
            <img src={logo} alt="ESIMEDIA" className="mobile-logo" />
          </div>
        )}

        {/* Buscador expandible - SOLUCIÓN PÍLDORA COMPLETA */}
        {showSearch ? (
          <div className="mobile-searchbar-container">
            {/* Icono de búsqueda */}
            <div className="mobile-search-icon">
              <IonIcon icon={searchOutline} />
            </div>
            
            {/* Input nativo - flex: 1 ocupa todo el espacio */}
            <input
              type="search"
              className="mobile-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery) setShowSearch(false);
              }}
              placeholder="Buscar contenido..."
              autoFocus
            />
            
            {/* Botón X - Solo visible si hay texto */}
            {searchQuery && (
              <button 
                className="mobile-clear-button"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                <IonIcon icon={closeOutline} />
              </button>
            )}
          </div>
        ) : null}

        {/* Botones de acción */}
        <div className="mobile-action-buttons">
          {/* Búsqueda */}
          {!showSearch && (
            <button className="mobile-icon-btn" onClick={() => setShowSearch(true)}>
              <IonIcon icon={searchOutline} />
            </button>
          )}

          {/* Filtros - siempre visible */}
          <button 
            id="filter-menu-trigger"
            className="mobile-icon-btn"
            onClick={() => {
              setIsFilterOpen(!isFilterOpen);
              setIsMenuOpen(false);
            }}
          >
            <IonIcon icon={filterOutline} />
          </button>

          {/* Avatar con menú - se oculta cuando búsqueda está activa */}
          {!showSearch && (
            <button 
              className="mobile-icon-btn avatar-button" 
              id="user-menu-trigger"
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                setIsFilterOpen(false);
              }}
            >
              <div className="mobile-avatar">
                {userProfile.picture && !imageError ? (
                  <img 
                    src={userProfile.picture} 
                    alt="Perfil"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <IonIcon icon={person} />
                  </div>
                )}
                {userProfile.vip && (
                  <div className="vip-badge-mobile">
                    <i className="fas fa-crown"></i>
                  </div>
                )}
              </div>
            </button>
          )}
        </div>

        {/* Modal de Filtros Avanzados */}
        <MobileFilterModal
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          currentFilters={currentFilters}
          onApplyFilters={onFiltersChange}
        />

        {/* Popover de Usuario */}
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
              <IonIcon icon={personCircleOutline} />
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

      </div>
    </div>
  );
};

export default MobileHeader;
