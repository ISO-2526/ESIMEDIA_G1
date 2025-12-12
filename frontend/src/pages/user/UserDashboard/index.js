import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { IonIcon } from '@ionic/react';
import { notificationsOutline } from 'ionicons/icons';
import ContentLayout from '../../../layouts/ContentLayout';
import VideoPlayer from '../../../components/VideoPlayer';
import AudioPlayer from '../../../components/AudioPlayer';
import ContentFilters from '../../../components/ContentFilters';
import AddToPlaylistModal from '../../../components/AddToPlaylistModal';
import VipUpgradeModal from '../../../components/VipUpgradeModal';
import CreatorPlaylistCard from '../../../components/CreatorPlaylistCard';
import MobileHeader from '../../../components/mobile/MobileHeader'; // 📱 Componente móvil nativo
import NotificationItem from '../../../components/NotificationItem';
import { useNotifications } from '../../../hooks/useNotifications';
import logo from '../../../resources/esimedialogo.png';
import './UserDashboard.css';
import { handleLogout as logoutCsrf } from '../../../auth/logout';
import CustomModal from '../../../components/CustomModal';
import { useModal } from '../../../utils/useModal';
import axios from '../../../api/axiosConfig'; // ✅ Usar axios con CapacitorHttp
import {
  filterBySearch,
  filterByCategories,
  filterByYearRange,
  filterByDuration,
  filterByMinRating,
  SORT_COMPARATORS,
  transformContent,
  missingMediaMessage,
  isVipBlocked
} from '../../../utils/contentUtils';
import { useScrollInfo, useActiveTabObserver, useAutoHeroRotation } from '../../../hooks/dashboardHooks';
import { useClickOutside } from '../../../hooks/useClickOutside';

// Hooks y utilidades ahora importadas desde archivos externos para reducir complejidad.

// Componente Header desacoplado
function DashboardHeader({
  logo,
  activeTab,
  setActiveTab,
  creatorPlaylists,
  searchQuery,
  setSearchQuery,
  handleAddToPlaylist,
  userProfile,
  handleLogout,
  showUserMenu,
  setShowUserMenu,
  handleFiltersChange
}) {
  const location = useLocation();
  const history = useHistory();
  
  // Usar el hook de notificaciones centralizado
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    handleNotificationClick 
  } = useNotifications();

  // Estado local para el desplegable de notificaciones
  const [showNotifications, setShowNotifications] = useState(false);

  // Refs para botones y dropdowns
  const notificationsButtonRef = useRef(null);
  const userMenuButtonRef = useRef(null);

  // Hook para cerrar el desplegable al hacer clic fuera (solo en web)
  const notificationsRef = useClickOutside(() => setShowNotifications(false), showNotifications, [notificationsButtonRef]);
  const userMenuRef = useClickOutside(() => setShowUserMenu(false), showUserMenu, [userMenuButtonRef]);

  // Cerrar todos los menús al cambiar de página
  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifications(false);
  }, [location.pathname, setShowUserMenu]);

  // Listener global para cerrar menús al hacer clic en el documento
  useEffect(() => {
    const handleDocumentClick = (e) => {
      // Si hay algún menú abierto y el clic es fuera de los refs
      if (showUserMenu || showNotifications) {
        // Los refs ya manejan el cierre automático
        // Este efecto es un respaldo adicional
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, [showUserMenu, showNotifications]);

  // Prevenir scroll cuando se abren los menus
  useEffect(() => {
    if (showUserMenu || showNotifications) {
      // Bloquear scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Restaurar scroll cuando se cierran los menús
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [showUserMenu, showNotifications]);

  return (
    <header className="dashboard-header">
      <div className="header-container">
        <div className="header-left">
          <img src={logo} className="logo-dashboard" alt="ESIMEDIA" />
        </div>
        <div className="header-right">
          <nav className="nav-links-dashboard">
            <button
              className={`nav-link-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('all');
                document.querySelector('#all-content-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <i className="fas fa-th-large"></i> Todo el contenido
            </button>
            {creatorPlaylists.length > 0 && (
              <button
                className={`nav-link-btn ${activeTab === 'creators' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('creators');
                  document.querySelector('#creators-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <i className="fas fa-star-half-alt"></i> Selección de creadores
              </button>
            )}
            <button
              className={`nav-link-btn ${activeTab === 'video' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('video');
                document.querySelector('#video-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <i className="fas fa-film"></i> Video
            </button>
            <button
              className={`nav-link-btn ${activeTab === 'audio' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('audio');
                document.querySelector('#audio-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <i className="fas fa-headphones-alt"></i> Audio
            </button>
          </nav>

          <nav className="nav-links-secondary">
            <Link to="/playlists"><i className="fas fa-list"></i> Mis Listas</Link>
          </nav>

            <ContentFilters onFiltersChange={handleFiltersChange} />

          <div className="search-container-dashboard">
            <input
              type="text"
              placeholder="Buscar contenido..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input-dashboard"
            />
            <i className="fas fa-search search-icon-dashboard"></i>
          </div>

          {/* Botón de notificaciones */}
          <button
            ref={notificationsButtonRef}
            className="notifications-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifications(prev => !prev);
              setShowUserMenu(false); // Cerrar menú de usuario si está abierto
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              marginRight: '10px',
              position: 'relative'
            }}
          >
            <IonIcon icon={notificationsOutline} style={{ fontSize: '24px', color: '#666' }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid rgba(18, 18, 18, 0.9)',
                boxShadow: '0 2px 8px rgba(255, 107, 107, 0.4)',
                zIndex: 1
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          <div className="user-menu-container">
            <div
              ref={userMenuButtonRef}
              className="user-avatar-dashboard"
              onClick={(e) => {
                e.stopPropagation();
                setShowUserMenu(prev => !prev);
                setShowNotifications(false); // Cerrar notificaciones si están abiertas
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' || e.key === ' ') { 
                  e.preventDefault(); 
                  setShowUserMenu(prev => !prev);
                  setShowNotifications(false);
                } 
              }}
              style={{ position: 'relative' }}
            >
              <img
                src={userProfile.picture}
                alt="Perfil de usuario"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
              {userProfile.vip && (
                <div style={{
                  position: 'absolute', top: '-5px', right: '-5px',
                  background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                  borderRadius: '50%', width: '24px', height: '24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(255, 193, 7, 0.6)',
                  border: '2px solid #1a1a2e', zIndex: 9999
                }}>
                  <i className="fas fa-crown" style={{ color: '#1a1a2e', fontSize: '12px' }}></i>
                </div>
              )}
            </div>
            {showUserMenu && (
              <div 
                ref={userMenuRef}
                className="user-dropdown-dashboard"
                onClick={(e) => e.stopPropagation()}
              >
                <Link to="/perfil" className="dropdown-item"><i className="fas fa-user-circle"></i> Mi Perfil</Link>
                <Link to="/playlists" className="dropdown-item"><i className="fas fa-list"></i> Mis Listas</Link>
                <Link to="/suscripcion" className="dropdown-item"><i className="fas fa-credit-card"></i> Suscripción</Link>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item logout-btn">
                  <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                </button>
              </div>
            )}
          </div>

          {/* Dropdown de notificaciones */}
          {showNotifications && (
            <div 
              ref={notificationsRef}
              className="notifications-dropdown"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '60px',
                right: '10px',
                background: 'rgba(18, 18, 18, 0.95)',
              backdropFilter: 'blur(30px) saturate(180%)',
              WebkitBackdropFilter: 'blur(30px) saturate(180%)',
              borderRadius: '20px',
              boxShadow: '0 4px 15px rgba(79, 86, 186, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              width: '300px',
              maxHeight: '400px',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '1px solid rgba(79, 86, 186, 0.2)',
                fontWeight: 'bold',
                color: '#F5F6F3',
                background: 'rgba(79, 86, 186, 0.1)',
                borderRadius: '20px 20px 0 0'
              }}>
                Notificaciones
              </div>
              <div style={{
                maxHeight: '320px',
                overflowY: 'auto',
                padding: '8px'
              }}>
                {loading ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '40px 20px',
                    color: 'rgba(245, 246, 243, 0.7)',
                    fontSize: '14px'
                  }}>
                    Cargando notificaciones...
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => {
                        handleNotificationClick(notification);
                        setShowNotifications(false);
                      }}
                      onMarkAsRead={markAsRead}
                    />
                  ))
                ) : (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: 'rgba(245, 246, 243, 0.6)'
                  }}>
                    <IonIcon icon={notificationsOutline} style={{ fontSize: '48px', marginBottom: '8px', opacity: 0.5 }} />
                    <p>No tienes notificaciones nuevas</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// Componente Hero
function HeroSection({
  currentHero,
  heroTransition,
  handlePlayHero,
  handleAddToPlaylist,
  heroContent,
  handleBackToOriginal
}) {
  if (!currentHero) return null;
  return (
    <section
      className={`hero-dashboard ${heroTransition ? 'hero-transition' : ''}`}
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(41, 43, 38, 0.95)), url(${currentHero.imagen})`
      }}
    >
      <div className="hero-overlay"></div>
      <div className="hero-content-dashboard">
        {heroContent && (
          <button className="back-btn-dashboard" onClick={handleBackToOriginal}>
            <i className="fas fa-arrow-left"></i> Volver
          </button>
        )}
        <h1 className="hero-title-dashboard">{currentHero.titulo}</h1>
        <div className="hero-meta-dashboard">
          <span><i className="fas fa-calendar"></i> {currentHero.year}</span>
          <span><i className="fas fa-clock"></i> {currentHero.duration}</span>
          <span><i className="fas fa-user-shield"></i> {currentHero.rating}</span>
          <span className="hero-rating">
            <i className="fas fa-star" style={{ color: '#FAED5C' }}></i> {currentHero.ratingStars}
          </span>
        </div>
        <p className="hero-description-dashboard">{currentHero.description}</p>
        <div className="hero-buttons-dashboard">
          <button className="btn-dashboard btn-primary-dashboard" onClick={handlePlayHero}>
            <i className="fas fa-play"></i> Reproducir
          </button>
          <button
            className="btn-dashboard btn-secondary-dashboard"
            onClick={() => handleAddToPlaylist(currentHero)}
          >
            <i className="fas fa-plus"></i> Mi Lista
          </button>
        </div>
      </div>
    </section>
  );
}

// Slider de playlists de creadores
function CreatorPlaylistsSlider({ creatorPlaylists, navigate }) {
  if (!creatorPlaylists.length) return null;
  return (
    <div id="creators-section">
      <section className="content-section creator-playlists-section">
        <h2 className="section-title-dashboard">
          <i className="fas fa-star-half-alt"></i> Selección de nuestros creadores
        </h2>
        <div className="netflix-slider-wrapper">
          <div className="netflix-slider-container">
            <button
              className="netflix-slider-nav netflix-slider-prev"
              onClick={() => document.querySelector('.creator-playlists-slider')
                ?.scrollBy({ left: -600, behavior: 'smooth' })}
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <div className="creator-playlists-slider">
              {creatorPlaylists.map(pl => (
                <div key={pl.id} className="netflix-playlist-item">
                  <CreatorPlaylistCard
                    playlist={pl}
                    onClick={() => navigate(`/creator-playlists/${pl.id}`)}
                  />
                </div>
              ))}
            </div>
            <button
              className="netflix-slider-nav netflix-slider-next"
              onClick={() => document.querySelector('.creator-playlists-slider')
                ?.scrollBy({ left: 600, behavior: 'smooth' })}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
            <div className="slider-fade-left"></div>
            <div className="slider-fade-right"></div>
          </div>
        </div>
      </section>
    </div>
  );
}

function UserDashboard() {
  const history = useHistory();
  const { modalState, closeModal } = useModal();
  const { scrolled, scrollProgress } = useScrollInfo();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [heroContent, setHeroContent] = useState(null);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const [creatorPlaylists, setCreatorPlaylists] = useState([]);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [notification, setNotification] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroTransition, setHeroTransition] = useState(false);
  const [playingContent, setPlayingContent] = useState(null);
  const [filters, setFilters] = useState({
    yearRange: { min: 2000, max: new Date().getFullYear() },
    categories: [],
    sortBy: 'recent',
    durationRange: { min: 0, max: 180 },
    minRating: 0
  });
  const [activeTab, setActiveTab] = useState('all');
  const [userProfile, setUserProfile] = useState({ picture: '/pfp/avatar1.png', vip: false });
  const [showVipModal, setShowVipModal] = useState(false);
  const [selectedVipContent, setSelectedVipContent] = useState(null);

  useActiveTabObserver(setActiveTab);
  useAutoHeroRotation(contents, heroContent, playingContent, setHeroTransition, setCurrentHeroIndex);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  useEffect(() => {
    fetchContents();
    fetchPlaylists();
    fetchCreatorPlaylists();
    loadUserProfile();
  }, []);

  // ⚠️ HYBRID STRATEGY: Función para construir URLs absolutas en móvil
  const getImageUrl = (path) => {
    if (!path) return '/pfp/avatar1.png'; // Fallback
    if (path.startsWith('http')) return path; // Ya es absoluta
    // Si es nativo y ruta relativa, usar backend android
    if (Capacitor.isNativePlatform()) {
      return `http://10.0.2.2:8080${path}`;
    }
    return path; // Web: usar ruta relativa
  };

  const loadUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile', {
        withCredentials: true
      });
      const profileData = response.data;
      const updatedProfile = {
        name: profileData.name,
        surname: profileData.surname,
        email: profileData.email,
        alias: profileData.alias,
        dateOfBirth: profileData.dateOfBirth,
        picture: getImageUrl(profileData.picture), // ✅ URL absoluta en móvil
        vip: profileData.vip || false
      };
      setUserProfile(updatedProfile);
      console.log('🖼️ Profile picture URL:', updatedProfile.picture);
    } catch (error) {
      console.error('Error al cargar el perfil del usuario:', error);
    }
  };

  const fetchContents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/public/contents');
      const data = response.data;
      console.log('Datos recibidos del backend:', data);
      const transformedContents = data.map(content => transformContent(content));
      console.log('Contenidos transformados:', transformedContents);
      setContents(transformedContents);
    } catch (error) {
      console.error('Error fetching contents:', error);
      showNotification('Error de conexión al cargar contenidos', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener y reproducir un contenido específico desde notificación
  const fetchAndPlayContent = async (contentId, contentType) => {
    try {
      console.log(`📥 Obteniendo contenido ${contentId} del backend...`);
      const response = await axios.get(`/api/public/contents/${contentId}`);
      const contentData = response.data;
      
      if (contentData) {
        const transformedContent = transformContent(contentData);
        console.log(`✅ Contenido obtenido: ${transformedContent.titulo}`);
        
        // Verificar que el tipo coincida
        if (contentType && transformedContent.type.toLowerCase() !== contentType.toLowerCase()) {
          console.warn(`⚠️ El tipo de contenido no coincide: esperado ${contentType}, recibido ${transformedContent.type}`);
        }
        
        playContent(transformedContent);
      } else {
        showNotification('Contenido no encontrado', 'warning');
      }
    } catch (error) {
      console.error('Error al obtener contenido desde notificación:', error);
      if (error.response?.status === 404) {
        showNotification('El contenido ya no está disponible', 'warning');
      } else if (error.response?.status === 403) {
        showNotification('No tienes permisos para ver este contenido', 'warning');
      } else {
        showNotification('Error al cargar el contenido', 'error');
      }
    }
  };

  // Transformación ahora importada como transformContent

  const fetchPlaylists = async () => {
    try {
      const response = await axios.get('/api/playlists', { withCredentials: true });
      setPlaylists(response.data);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const fetchCreatorPlaylists = async () => {
    try {
      const response = await axios.get('/api/creator/playlists/public', { withCredentials: true });
      setCreatorPlaylists(response.data);
    } catch (error) {
      console.error('Error fetching creator playlists:', error);
    }
  };



  const handleAddToPlaylist = (content) => {
    // Check if content is VIP-only and user is not VIP
    if (content.vipOnly && !userProfile.vip) {
      setSelectedVipContent(content);
      setShowVipModal(true);
      return;
    }
    
    setSelectedContent(content);
    setShowPlaylistModal(true);
  };

  const handleClosePlaylistModal = () => {
    setShowPlaylistModal(false);
    setSelectedContent(null);
    fetchPlaylists(); // Refresh playlists para reflejar cambios
  };

  // Filtrar contenidos usando pipeline de funciones para menor complejidad.
  const getFilteredContent = () => {
    const pipeline = [
      list => filterBySearch(list, searchQuery),
      list => filterByCategories(list, filters.categories),
      list => filterByYearRange(list, filters.yearRange),
      list => filterByDuration(list, filters.durationRange, 0, 180),
      list => filterByMinRating(list, filters.minRating)
    ];
    const sorter = SORT_COMPARATORS[filters.sortBy] || SORT_COMPARATORS.recent;
    let result = pipeline.reduce((acc, fn) => fn(acc), contents.slice());
    result.sort(sorter.cmp);
    return result;
  };

  // REEMPLAZO: logout unificado
  const handleLogout = () => logoutCsrf('/', history);

  // Separar contenido por tipo
  const getAudioContent = () => {
    return getFilteredContent().filter(item => item.type === 'AUDIO');
  };

  const getVideoContent = () => {
    return getFilteredContent().filter(item => item.type === 'VIDEO');
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Reutilizar lógica de reproducción en una sola función.
  const playContent = useCallback((content) => {
    if (!content) return;
    if (isVipBlocked(content, userProfile.vip)) {
      setSelectedVipContent(content); setShowVipModal(true); return;
    }
    const mediaError = missingMediaMessage(content);
    if (mediaError) { showNotification(mediaError, 'warning'); return; }
    setPlayingContent(content);
  }, [userProfile.vip, showNotification]);

  // Efecto para reproducir contenido desde notificaciones usando eventos personalizados
  useEffect(() => {
    const handlePlayFromNotification = (event) => {
      const { contentId, contentType } = event.detail;
      
      console.log(`📬 Evento de notificación recibido - ID: ${contentId}, Tipo: ${contentType}`);
      
      // Esperar a que haya contenidos cargados
      if (contents.length === 0) {
        console.log('⏳ Esperando a que se carguen los contenidos...');
        // Reintentar después de un breve delay
        setTimeout(() => {
          const contentToPlay = contents.find(content => content.id === contentId);
          if (contentToPlay) {
            playContent(contentToPlay);
          } else {
            fetchAndPlayContent(contentId, contentType);
          }
        }, 500);
        return;
      }
      
      // Buscar el contenido en la lista local
      const contentToPlay = contents.find(content => content.id === contentId);
      
      if (contentToPlay) {
        console.log(`🎵 Reproduciendo contenido: ${contentToPlay.titulo} (${contentToPlay.type})`);
        playContent(contentToPlay);
      } else {
        // Si no está en la lista local, intentar obtenerlo del backend
        console.log(`🔍 Contenido ${contentId} no encontrado localmente, obteniendo del backend...`);
        fetchAndPlayContent(contentId, contentType);
      }
    };

    // Escuchar evento personalizado
    window.addEventListener('playContentFromNotification', handlePlayFromNotification);

    return () => {
      window.removeEventListener('playContentFromNotification', handlePlayFromNotification);
    };
  }, [contents, playContent, fetchAndPlayContent]);

  // Efecto adicional para manejar state de react-router (compatibilidad)
  useEffect(() => {
    const locationState = history.location.state;
    if (locationState && locationState.playContentId) {
      const contentId = locationState.playContentId;
      const contentType = locationState.contentType;
      
      console.log(`📬 Notificación detectada via state - ID: ${contentId}, Tipo: ${contentType}`);
      
      // Esperar a que haya contenidos cargados
      if (contents.length === 0) {
        console.log('⏳ Esperando a que se carguen los contenidos...');
        return;
      }
      
      // Buscar el contenido en la lista local
      const contentToPlay = contents.find(content => content.id === contentId);
      
      if (contentToPlay) {
        console.log(`🎵 Reproduciendo contenido desde notificación: ${contentToPlay.titulo} (${contentToPlay.type})`);
        playContent(contentToPlay);
        // Limpiar el estado para evitar reproducciones repetidas
        history.replace({ ...history.location, state: {} });
      } else {
        // Si no está en la lista local, intentar obtenerlo del backend
        console.log(`🔍 Contenido ${contentId} no encontrado localmente, obteniendo del backend...`);
        fetchAndPlayContent(contentId, contentType);
        // Limpiar el estado
        history.replace({ ...history.location, state: {} });
      }
    }
  }, [contents, history.location.state, playContent, history]);

  const handleContentClick = playContent;

  const handleVipUpgrade = () => {
    setShowVipModal(false);
    history.push('/suscripcion');
  };

  const handleShowInfo = (content) => {
    setHeroContent(content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToOriginal = () => {
    setHeroContent(null);
  };

  const handleCloseVideo = useCallback(() => {
    console.log('Cerrando media player');
    setPlayingContent(null);
  }, []);

  const handlePlayHero = () => playContent(currentHero);



  const currentHero = useMemo(
    () => heroContent || (contents.length > 0 ? contents[currentHeroIndex] : null),
    [heroContent, contents, currentHeroIndex]
  );

  if (loading) {
    return (
      <div className="user-dashboard">
        <div className="animated-bg"></div>
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          height: '100vh', color: '#fff', fontSize: '1.5rem'
        }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
          Cargando contenidos...
        </div>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      <div className="animated-bg"></div>
      <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }}></div>

      {/* 📱 Renderizado condicional: Móvil vs Desktop */}
      {Capacitor.isNativePlatform() ? (
        <MobileHeader
          userProfile={userProfile}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleLogout={handleLogout}
          currentFilters={filters}
          onFiltersChange={handleFiltersChange}
          showSearch={true}
          showFilters={true}
          showNotifications={true}
        />
      ) : (
        <DashboardHeader
          logo={logo}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          creatorPlaylists={creatorPlaylists}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleAddToPlaylist={handleAddToPlaylist}
          userProfile={userProfile}
          handleLogout={handleLogout}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
          handleFiltersChange={handleFiltersChange}
        />
      )}

      <HeroSection
        currentHero={currentHero}
        heroTransition={heroTransition}
        handlePlayHero={handlePlayHero}
        handleAddToPlaylist={handleAddToPlaylist}
        heroContent={heroContent}
        handleBackToOriginal={handleBackToOriginal}
      />

      <main className="dashboard-main">
        <CreatorPlaylistsSlider
          creatorPlaylists={creatorPlaylists}
          navigate={history}
        />

        <ContentLayout
          title={<><i className="fas fa-th-large"></i> Todo el contenido</>}
          content={getFilteredContent()}
          onContentClick={handleContentClick}
          onShowInfo={handleShowInfo}
          searchQuery={searchQuery}
          onAddToPlaylist={handleAddToPlaylist}
          isUserVip={userProfile.vip}
        />

        <ContentLayout
          title={<><i className="fas fa-film"></i> Videos</>}
          content={getVideoContent()}
          onContentClick={handleContentClick}
          onShowInfo={handleShowInfo}
          searchQuery={searchQuery}
          onAddToPlaylist={handleAddToPlaylist}
          isUserVip={userProfile.vip}
        />

        <ContentLayout
          title={<><i className="fas fa-headphones-alt"></i> Audio</>}
          content={getAudioContent()}
          onContentClick={handleContentClick}
          onShowInfo={handleShowInfo}
          searchQuery={searchQuery}
          onAddToPlaylist={handleAddToPlaylist}
          isUserVip={userProfile.vip}
        />
      </main>

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={handleClosePlaylistModal}
        content={selectedContent}
      />

      {/* VIP Upgrade Modal */}
      <VipUpgradeModal
        isOpen={showVipModal}
        onClose={() => setShowVipModal(false)}
        onConfirm={handleVipUpgrade}
        contentTitle={selectedVipContent?.titulo}
      />

      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          <i className={`fas ${
            notification.type === 'success' ? 'fa-check-circle' : 
            notification.type === 'error' ? 'fa-exclamation-circle' : 
            notification.type === 'warning' ? 'fa-exclamation-triangle' : 
            'fa-info-circle'
          }`}></i>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Scroll to Top Button */}
      {scrolled && (
        <button 
          className="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <i className="fas fa-arrow-up"></i>
        </button>
      )}

      {/* Video/Audio Player */}
      {playingContent && playingContent.type === 'VIDEO' && (
        <VideoPlayer
          videoUrl={playingContent.videoUrl}
          title={playingContent.titulo}
          contentId={playingContent.id}
          onClose={handleCloseVideo}
          onAddToPlaylist={handleAddToPlaylist}
        />
      )}

      {playingContent && playingContent.type === 'AUDIO' && (
        <AudioPlayer
          audioFileName={playingContent.audioFileName}
          title={playingContent.titulo}
          contentId={playingContent.id}
          onClose={handleCloseVideo}
          onAddToPlaylist={handleAddToPlaylist}
        />
      )}

      {/* Modal personalizado */}
      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
    </div>
  );
}

export default UserDashboard;

DashboardHeader.propTypes = {
  logo: PropTypes.string.isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  creatorPlaylists: PropTypes.array.isRequired,
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  handleAddToPlaylist: PropTypes.func.isRequired,
  userProfile: PropTypes.shape({ picture: PropTypes.string, vip: PropTypes.bool }).isRequired,
  handleLogout: PropTypes.func.isRequired,
  showUserMenu: PropTypes.bool.isRequired,
  setShowUserMenu: PropTypes.func.isRequired,
  handleFiltersChange: PropTypes.func.isRequired
};

HeroSection.propTypes = {
  currentHero: PropTypes.object,
  heroTransition: PropTypes.bool.isRequired,
  handlePlayHero: PropTypes.func.isRequired,
  handleAddToPlaylist: PropTypes.func.isRequired,
  heroContent: PropTypes.object,
  handleBackToOriginal: PropTypes.func.isRequired
};

CreatorPlaylistsSlider.propTypes = {
  creatorPlaylists: PropTypes.array.isRequired,
  navigate: PropTypes.func.isRequired
};