import React, { useState } from 'react';
import { 
  IonIcon,
  IonSearchbar,
  IonPopover,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/react';
import { 
  searchOutline, 
  filterOutline, 
  personCircleOutline,
  listOutline,
  cardOutline,
  logOutOutline
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import logo from '../../../resources/esimedialogo.png';
import './MobileHeader.css';

const MobileHeader = ({ 
  userProfile, 
  searchQuery, 
  setSearchQuery,
  handleLogout 
}) => {
  const [showSearch, setShowSearch] = useState(false);
  const history = useHistory();

  return (
    <div className={`mobile-header-ionic ${showSearch ? 'search-expanded' : ''}`}>
      <div className="mobile-toolbar">
        {/* Logo - se oculta cuando búsqueda está activa */}
        {!showSearch && (
          <div className="mobile-logo-container">
            <img src={logo} alt="ESIMEDIA" className="mobile-logo" />
          </div>
        )}

        {/* Buscador expandible */}
        {showSearch ? (
          <IonSearchbar
            mode="md"
            value={searchQuery}
            onIonChange={e => setSearchQuery(e.detail.value)}
            onIonBlur={() => {
              if (!searchQuery) setShowSearch(false);
            }}
            placeholder="Buscar contenido..."
            className="mobile-searchbar"
            animated
            autoFocus
            showCancelButton="never"
          />
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
          <button className="mobile-icon-btn" id="filters-trigger">
            <IonIcon icon={filterOutline} />
          </button>

          {/* Avatar con menú - se oculta cuando búsqueda está activa */}
          {!showSearch && (
            <button className="mobile-icon-btn avatar-button" id="user-menu-trigger">
              <div className="mobile-avatar">
                <img 
                  src={userProfile.picture} 
                  alt="Perfil" 
                />
                {userProfile.vip && (
                  <div className="vip-badge-mobile">
                    <i className="fas fa-crown"></i>
                  </div>
                )}
              </div>
            </button>
          )}
        </div>

        {/* Popover de Usuario */}
        <IonPopover 
          trigger="user-menu-trigger" 
          dismissOnSelect={true}
          className="user-menu-popover"
        >
          <IonList lines="none">
            <IonItem button detail={false} onClick={() => history.push('/perfil')}>
              <IonIcon icon={personCircleOutline} slot="start" />
              <IonLabel>Mi Perfil</IonLabel>
            </IonItem>
            <IonItem button detail={false} onClick={() => history.push('/playlists')}>
              <IonIcon icon={listOutline} slot="start" />
              <IonLabel>Mis Listas</IonLabel>
            </IonItem>
            <IonItem button detail={false} onClick={() => history.push('/suscripcion')}>
              <IonIcon icon={cardOutline} slot="start" />
              <IonLabel>Suscripción</IonLabel>
            </IonItem>
            <IonItem 
              button 
              detail={false} 
              onClick={handleLogout}
              className="logout-item"
            >
              <IonIcon icon={logOutOutline} slot="start" color="danger" />
              <IonLabel color="danger">Cerrar Sesión</IonLabel>
            </IonItem>
          </IonList>
        </IonPopover>

        {/* Popover de Filtros */}
        <IonPopover 
          trigger="filters-trigger" 
          dismissOnSelect={true}
          className="filters-popover"
        >
          <IonList lines="none">
            <IonItem>
              <IonLabel>
                <h3>Filtros</h3>
                <p>Proximamente disponible</p>
              </IonLabel>
            </IonItem>
          </IonList>
        </IonPopover>
      </div>
    </div>
  );
};

export default MobileHeader;
