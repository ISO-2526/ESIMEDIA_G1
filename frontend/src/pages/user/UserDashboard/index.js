import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Link, useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import ContentLayout from '../../../layouts/ContentLayout';
import VideoPlayer from '../../../components/VideoPlayer';
import AudioPlayer from '../../../components/AudioPlayer';
import ContentFilters from '../../../components/ContentFilters';
import AddToPlaylistModal from '../../../components/AddToPlaylistModal';
import VipUpgradeModal from '../../../components/VipUpgradeModal';
import CreatorPlaylistCard from '../../../components/CreatorPlaylistCard';
import MobileHeader from '../../../components/mobile/MobileHeader'; // 📱 Componente móvil nativo
import NotificationBell from '../../../components/NotificationBell/NotificationBell';
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

          {/* Campana de notificaciones */}
          {userProfile?.email && <NotificationBell userId={userProfile.email} />}

          <div className="user-menu-container">
            <div
              className="user-avatar-dashboard"
              onClick={() => setShowUserMenu(s => !s)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowUserMenu(s => !s); } }}
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
              <div className="user-dropdown-dashboard">
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
  const [playingVideo, setPlayingVideo] = useState(null);
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
  useAutoHeroRotation(contents, heroContent, playingVideo, setHeroTransition, setCurrentHeroIndex);

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
      console.log('📧 User email for notifications:', updatedProfile.email);
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
  const handleLogout = () => logoutCsrf(history, '/');

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
  const playContent = (content) => {
    if (!content) return;
    if (isVipBlocked(content, userProfile.vip)) {
      setSelectedVipContent(content); setShowVipModal(true); return;
    }
    const mediaError = missingMediaMessage(content);
    if (mediaError) { showNotification(mediaError, 'warning'); return; }
    setPlayingVideo(content);
  };

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
    console.log('Cerrando video player');
    setPlayingVideo(null);
  }, []);

  const handlePlayHero = () => playContent(currentHero);

  // Listener para reproducir contenido desde notificaciones
  useEffect(() => {
    const handlePlayFromNotification = (event) => {
      console.log('[UserDashboard] Event received:', event);
      const { content } = event.detail;
      console.log('[UserDashboard] Content from event:', content);
      
      if (content) {
        // Verificar filtros VIP y media antes de reproducir
        if (isVipBlocked(content, userProfile.vip)) {
          console.log('[UserDashboard] Content is VIP blocked');
          setSelectedVipContent(content);
          setShowVipModal(true);
          return;
        }
        const mediaError = missingMediaMessage(content);
        if (mediaError) {
          console.log('[UserDashboard] Media error:', mediaError);
          showNotification(mediaError, 'warning');
          return;
        }
        console.log('[UserDashboard] Setting playing video:', content);
        setPlayingVideo(content);
      }
    };
    
    console.log('[UserDashboard] Adding event listener');
    window.addEventListener('playContentFromNotification', handlePlayFromNotification);
    
    return () => {
      console.log('[UserDashboard] Removing event listener');
      window.removeEventListener('playContentFromNotification', handlePlayFromNotification);
    };
  }, [userProfile.vip, showNotification]);

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
          {' '}
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
          navigate={history.push}
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
      {playingVideo && playingVideo.type === 'VIDEO' && (
        <VideoPlayer
          videoUrl={playingVideo.videoUrl}
          title={playingVideo.titulo}
          contentId={playingVideo.id}
          onClose={handleCloseVideo}
          onAddToPlaylist={handleAddToPlaylist}
        />
      )}

      {playingVideo && playingVideo.type === 'AUDIO' && (
        <AudioPlayer
          audioFileName={playingVideo.audioFileName}
          title={playingVideo.titulo}
          contentId={playingVideo.id}
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