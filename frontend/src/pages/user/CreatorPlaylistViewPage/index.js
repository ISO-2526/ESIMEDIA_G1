import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import MobileHeader from '../../../components/mobile/MobileHeader';
import { handleLogout as logoutCsrf } from '../../../auth/logout';
import ContentCard from '../../../components/ContentCard';
import AudioPlayer from '../../../components/AudioPlayer';
import VideoPlayer from '../../../components/VideoPlayer';
import './CreatorPlaylistViewPage.css';
import CustomModal from '../../../components/CustomModal';
import { useModal } from '../../../utils/useModal';
import { createOverlayKeyboardHandlers, createDialogKeyboardHandlers } from '../../../utils/overlayAccessibility';
import axios from '../../../api/axiosConfig';

function CreatorPlaylistViewPage() {
  const { id } = useParams();
  const history = useHistory();
  const { modalState, closeModal, showSuccess, showError, showWarning } = useModal();
  const [playlist, setPlaylist] = useState(null);
  const [contents, setContents] = useState([]);
  const [allContents, setAllContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({ picture: '/pfp/avatar1.png', vip: false });

  // Función para obtener URL absoluta en Android
  const getImageUrl = (path) => {
    if (!path) return '/pfp/avatar1.png';
    if (path.startsWith('http')) return path;
    if (Capacitor.isNativePlatform()) {
      return `http://10.0.2.2:8080${path}`;
    }
    return path;
  };

  const handleLogout = async () => {
    await logoutCsrf('/', history);
  };

  const loadUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile', { withCredentials: true });
      setUserProfile({
        picture: getImageUrl(response.data.picture),
        vip: response.data.vip || false
      });
    } catch (error) {
      console.error('Error al cargar el perfil del usuario:', error);
    }
  };

  const [sortBy, setSortBy] = useState('addedDate');
  const [selectedContent, setSelectedContent] = useState(null);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [contentCovers, setContentCovers] = useState([]);

  useEffect(() => {
    fetchAllContents();
    fetchPlaylistDetails();
    fetchFavorites();
    loadUserProfile();
  }, [id]);

  useEffect(() => {
    if (playlist && playlist.items && allContents.length > 0) {
      fetchContents();
      fetchContentCovers();
    }
  }, [playlist, allContents]);

  const fetchContentCovers = () => {
    if (!playlist?.items || !allContents.length) return;

    const covers = playlist.items
      .slice(0, 4)
      .map(item => {
        const content = allContents.find(c => c.id === item.contentId);
        return content?.coverFileName ? `/cover/${content.coverFileName}` : '/cover/default.png';
      });
    
    setContentCovers(covers);
  };

  const fetchFavorites = async () => {
    try {
      const response = await axios.get('/api/users/favorites', { withCredentials: true });
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchAllContents = async () => {
    try {
      const response = await axios.get('/api/public/contents');
      setAllContents(response.data);
    } catch (error) {
      console.error('Error fetching all contents:', error);
    }
  };

  const fetchPlaylistDetails = async () => {
    try {
      const response = await axios.get(`/api/creator/playlists/public`);
      const data = response.data;
      const foundPlaylist = data.find(p => p.id === id);
      
      if (foundPlaylist && foundPlaylist.visible) {
        setPlaylist(foundPlaylist);
      } else {
        showWarning('Esta lista no está disponible');
        history.push('/usuario');
      }
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status) {
        showError('Error al cargar la lista');
      }
      history.push('/usuario');
    } finally {
      setLoading(false);
    }
  };

  const transformContentItem = (item, content) => {
    if (!content) return null;
    
    return {
      id: content.id,
      titulo: content.title,
      imagen: content.coverFileName ? `/cover/${content.coverFileName}` : '/cover/default.png',
      categoria: determineCategory(content.tags),
      year: new Date().getFullYear().toString(),
      duration: content.durationMinutes ? `${content.durationMinutes}m` : 'N/A',
      rating: content.edadMinima ? `${content.edadMinima}+` : 'TP',
      ratingStars: content.ratingStars || 0,
      description: content.description || 'Sin descripción disponible',
      videoUrl: content.url,
      audioFileName: content.audioFileName,
      tags: content.tags || [],
      addedAt: item.addedAt,
      type: content.type || 'VIDEO',
      creatorAlias: content.creatorAlias
    };
  };

  const CATEGORY_MAP = {
    'Música': 'Música',
    'Deportes': 'Deportes',
    'Documentales': 'Documentales',
    'Gameplay': 'Gameplay',
    'Podcast': 'Podcast'
  };

  const determineCategory = (tags) => {
    if (!tags?.length) return 'General';
    const matchedTag = tags.find(tag => CATEGORY_MAP[tag]);
    return CATEGORY_MAP[matchedTag] || tags[0];
  };

  const fetchContents = () => {
    if (!playlist?.items || !allContents.length) return;

    const transformedContents = playlist.items
      .map(item => {
        const content = allContents.find(c => c.id === item.contentId);
        return transformContentItem(item, content);
      })
      .filter(Boolean);

    setContents(transformedContents);
  };

  const removeFavorite = async (contentId) => {
    try {
      await axios.delete(`/api/users/favorites/${contentId}`, { withCredentials: true });
      setFavorites(favorites.filter(id => id !== contentId));
      showSuccess('Eliminado de favoritos');
    } catch (error) {
      showError('Error al eliminar de favoritos');
    }
  };

  const addFavorite = async (contentId) => {
    try {
      await axios.post('/api/users/favorites', 
        { contentId }, 
        { withCredentials: true }
      );
      setFavorites([...favorites, contentId]);
      showSuccess('Añadido a favoritos');
    } catch (error) {
      showError('Error al añadir a favoritos');
    }
  };

  const handleToggleFavorite = async (contentId) => {
    try {
      const action = favorites.includes(contentId) ? removeFavorite : addFavorite;
      await action(contentId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showError('Error de conexión');
    }
  };

  const handleShowInfo = (content) => {
    setSelectedContent(content);
  };

  const handleCloseInfo = () => {
    setSelectedContent(null);
  };

  const handlePlayContent = (content) => {
    setSelectedContent(content);
    content.type === 'AUDIO' ? setIsAudioPlayerOpen(true) : setIsVideoPlayerOpen(true);
  };

  const infoOverlayHandlers = createOverlayKeyboardHandlers(handleCloseInfo);
  const infoDialogHandlers = createDialogKeyboardHandlers(handleCloseInfo);



  const sortByAddedDate = (a, b) => new Date(b.addedAt) - new Date(a.addedAt);
  const sortByTitle = (a, b) => a.titulo.localeCompare(b.titulo);
  const sortByCategory = (a, b) => a.categoria.localeCompare(b.categoria);

  const SORT_FUNCTIONS = {
    'addedDate': sortByAddedDate,
    'title': sortByTitle,
    'category': sortByCategory
  };

  const getSortedContents = () => {
    const sorted = [...contents];
    const sortFunction = SORT_FUNCTIONS[sortBy];
    return sortFunction ? sorted.sort(sortFunction) : sorted;
  };

  if (loading) {
    return (
      <div className="playlist-detail-page">
        <div className="playlist-detail-container">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="playlist-detail-page">
        <div className="playlist-detail-container">
          <p>Lista no encontrada</p>
        </div>
      </div>
    );
  }

  const shouldShowInfoModal = selectedContent && !isAudioPlayerOpen && !isVideoPlayerOpen;
  const isContentFavorite = selectedContent && favorites.includes(selectedContent.id);

  return (
    <div className="playlist-detail-page">
      {Capacitor.isNativePlatform() && (
        <MobileHeader
          userProfile={userProfile}
          handleLogout={handleLogout}
          showSearch={false}
          showFilters={false}
          showNotifications={true}
        />
      )}
      <button className="floating-back-button" onClick={() => history.push('/usuario')}>
        <i className="fas fa-arrow-left"></i>
      </button>

      <div className="playlist-hero-section">
        <div className="playlist-hero-background">
          {contentCovers.length > 0 && (
            <div 
              className="hero-cover-blur" 
              style={{ backgroundImage: `url(${contentCovers[0]})` }}
            />
          )}
        </div>
        
        <div className="playlist-hero-content">
          <div className="playlist-hero-covers">
            {contentCovers.slice(0, 4).map((cover, index) => (
              <div 
                key={index}
                className={`hero-cover-item cover-position-${index + 1}`}
                style={{ backgroundImage: `url(${cover})` }}
              />
            ))}
          </div>
          
          <div className="playlist-hero-info">
            <span className="playlist-badge">
              <i className="fas fa-star"></i> Lista de Creador
            </span>
            <h1 className="playlist-hero-title">{playlist.nombre}</h1>
            {playlist.descripcion && (
              <p className="playlist-hero-description">{playlist.descripcion}</p>
            )}
            <div className="playlist-hero-meta">
              <div className="hero-meta-item">
                <i className="fas fa-user-circle"></i>
                <span>{playlist.creatorAlias || 'Creador'}</span>
              </div>
              <div className="hero-meta-separator">•</div>
              <div className="hero-meta-item">
                <i className="fas fa-film"></i>
                <span>{contents.length} {contents.length === 1 ? 'contenido' : 'contenidos'}</span>
              </div>
              <div className="hero-meta-separator">•</div>
              <div className="hero-meta-item">
                <i className="fas fa-calendar"></i>
                <span>{new Date(playlist.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="playlist-detail-container">

        <div className="playlist-content">
          <div className="playlist-controls">
            <div className="sort-controls">
              <label htmlFor="sort">Ordenar por:</label>
              <select 
                id="sort"
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="addedDate">Fecha de añadido</option>
                <option value="title">Título</option>
                <option value="category">Categoría</option>
              </select>
            </div>
          </div>

          {contents.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-list"></i>
              <p>Esta lista aún no tiene contenido</p>
            </div>
          ) : (
            <div className="playlist-contents">
              {getSortedContents().map((content) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  onClick={() => handlePlayContent(content)}
                  onShowInfo={() => handleShowInfo(content)}
                  onToggleFavorite={() => handleToggleFavorite(content.id)}
                  isFavorite={favorites.includes(content.id)}
                  showDate={true}
                  addedDate={content.addedAt}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de información del contenido */}
      {shouldShowInfoModal && (
        <div 
          className="modal-overlay" 
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseInfo();
            }
          }}
          onKeyDown={infoOverlayHandlers.onOverlayKeyDown}
          onKeyUp={infoOverlayHandlers.onOverlayKeyUp}
          role="button"
          tabIndex={0}
          aria-label="Cerrar información del contenido"
        >
          <div 
            className="modal-content content-info-modal" 
            onKeyDown={infoDialogHandlers.onDialogKeyDown}
            onKeyUp={infoDialogHandlers.onDialogKeyUp}
            role="dialog"
            aria-modal="true"
            tabIndex={0}
          >
            <button className="modal-close" onClick={handleCloseInfo}>
              <i className="fas fa-times"></i>
            </button>

            <div className="content-info-header">
              <img 
                src={selectedContent.imagen} 
                alt={selectedContent.titulo} 
                className="content-info-image"
              />
              <div className="content-info-overlay">
                <h2>{selectedContent.titulo}</h2>
                <div className="content-info-meta">
                  <span><i className="fas fa-tag"></i> {selectedContent.categoria}</span>
                  <span><i className="fas fa-clock"></i> {selectedContent.duration}</span>
                  <span><i className="fas fa-star"></i> {selectedContent.rating}</span>
                  {selectedContent.creatorAlias && (
                    <span><i className="fas fa-user"></i> {selectedContent.creatorAlias}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="content-info-body">
              <p>{selectedContent.description}</p>
              
              {selectedContent.tags && selectedContent.tags.length > 0 && (
                <div className="content-tags">
                  {selectedContent.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="content-info-actions">
              <button 
                className="btn-primary"
                onClick={() => {
                  handleCloseInfo();
                  handlePlayContent(selectedContent);
                }}
              >
                <i className="fas fa-play"></i> Reproducir
              </button>
              <button 
                className={`btn-secondary ${isContentFavorite ? 'active' : ''}`}
                onClick={() => handleToggleFavorite(selectedContent.id)}
              >
                <i className={`fa${isContentFavorite ? 's' : 'r'} fa-heart`}></i> 
                {isContentFavorite ? 'En Favoritos' : 'Añadir a Favoritos'}
              </button>

            </div>
          </div>
        </div>
      )}

      {/* Video Player */}
      {isVideoPlayerOpen && selectedContent && (
        <VideoPlayer
          content={selectedContent}
          onClose={() => {
            setIsVideoPlayerOpen(false);
            setSelectedContent(null);
          }}
        />
      )}

      {/* Audio Player */}
      {isAudioPlayerOpen && selectedContent && (
        <AudioPlayer
          content={selectedContent}
          onClose={() => {
            setIsAudioPlayerOpen(false);
            setSelectedContent(null);
          }}
        />
      )}

      <CustomModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
      />
    </div>
  );
}

export default CreatorPlaylistViewPage;
