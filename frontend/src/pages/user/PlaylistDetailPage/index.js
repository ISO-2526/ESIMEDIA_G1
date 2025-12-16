import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import MobileHeader from '../../../components/mobile/MobileHeader';
import { handleLogout as logoutCsrf } from '../../../auth/logout';
import ContentCard from '../../../components/ContentCard';
import AudioPlayer from '../../../components/AudioPlayer';
import VideoPlayer from '../../../components/VideoPlayer';
import VipUpgradeModal from '../../../components/VipUpgradeModal';
import './PlaylistDetailPage.css';
import CustomModal from '../../../components/CustomModal';
import { useModal } from '../../../utils/useModal';
import { determineCategoryFromTags } from '../../../utils/contentUtils';
import { createOverlayKeyboardHandlers, createDialogKeyboardHandlers } from '../../../utils/overlayAccessibility';
import axios from '../../../api/axiosConfig';

function PlaylistDetailPage() {
  const { id } = useParams();
  const history = useHistory();
  const { modalState, closeModal, showSuccess, showError, showWarning, showConfirm } = useModal();
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
    await logoutCsrf(history, '/');
  };
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [isAudioPlayerOpen, setIsAudioPlayerOpen] = useState(false);
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [selectedVipContent, setSelectedVipContent] = useState(null);
  const [contentCovers, setContentCovers] = useState([]);
  const [sortBy, setSortBy] = useState('addedDate');

  useEffect(() => {
    fetchAllContents();
    fetchPlaylistDetails();
    loadUserProfile();
  }, [id]);

  const loadUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile', {
        withCredentials: true
      });
      const profileData = response.data;
      setUserProfile({
        picture: getImageUrl(profileData.picture),
        vip: profileData.vip || false
      });
      console.log('🖼️ Profile picture URL (PlaylistDetailPage):', getImageUrl(profileData.picture));
    } catch (error) {
      console.error('Error al cargar el perfil del usuario:', error);
    }
  };

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
      const response = await axios.get(`/api/playlists/${id}`, { withCredentials: true });

      setPlaylist(response.data);
      setEditName(response.data.nombre);
      setEditDescription(response.data.descripcion || '');
    } catch (error) {
      console.error('Error:', error);
      if (error.response?.status === 403) {
        showWarning('No tienes permiso para ver esta lista');
        history.push('/playlists');
      } else {
        showError('Error al cargar la lista');
        history.push('/playlists');
      }
    } finally {
      setLoading(false);
    }
  };

  const getContentImage = (content, isVipUnavailable) => {
    if (isVipUnavailable) return '/cover/no_disponible_VIP.jpg';
    return content.coverFileName ? `/cover/${content.coverFileName}` : '/cover/default.png';
  };

  const getContentTitle = (content, isVipUnavailable) => {
    return isVipUnavailable ? `${content.title} (Contenido VIP)` : content.title;
  };

  const getContentDescription = (content, isVipUnavailable) => {
    if (isVipUnavailable) return 'Este contenido es exclusivo para usuarios VIP. Actualiza tu cuenta para acceder.';
    return content.description || 'Sin descripción disponible';
  };

  const transformContentItem = (item, content) => {
    if (!content) {
      console.warn('Content not found for id:', item.contentId);
      return null;
    }

    const isVipContentUnavailable = content.vipOnly && !userProfile.vip;
    
    return {
      id: content.id,
      titulo: getContentTitle(content, isVipContentUnavailable),
      imagen: getContentImage(content, isVipContentUnavailable),
      categoria: determineCategoryFromTags(content.tags),
      year: new Date().getFullYear().toString(),
      duration: content.durationMinutes ? `${content.durationMinutes}m` : 'N/A',
      rating: content.edadMinima ? `${content.edadMinima}+` : 'TP',
      description: getContentDescription(content, isVipContentUnavailable),
      ratingStars: content.ratingStars || 0,
      videoUrl: content.url,
      audioFileName: content.audioFileName,
      type: content.type || 'VIDEO',
      tags: content.tags || [],
      addedAt: item.addedAt,
      vipOnly: content.vipOnly || false,
      isVipUnavailable: isVipContentUnavailable
    };
  };

  const fetchContents = async () => {
    if (!playlist?.items?.length) {
      setContents([]);
      return;
    }

    try {
      const playlistContents = playlist.items
        .map(item => {
          const content = allContents.find(c => c.id === item.contentId);
          return transformContentItem(item, content);
        })
        .filter(Boolean);
      
      setContents(playlistContents);
    } catch (error) {
      console.error('Error fetching contents:', error);
    }
  };

  const sortByAddedDate = (a, b) => new Date(b.addedAt) - new Date(a.addedAt);
  const sortByTitle = (a, b) => a.titulo.localeCompare(b.titulo);
  const sortByDuration = (a, b) => parseDuration(b.duration) - parseDuration(a.duration);

  const SORT_FUNCTIONS = {
    'addedDate': sortByAddedDate,
    'title': sortByTitle,
    'duration': sortByDuration
  };

  const getSortedContents = () => {
    const sorted = [...contents];
    const sortFunction = SORT_FUNCTIONS[sortBy];
    return sortFunction ? sorted.sort(sortFunction) : sorted;
  };

  const parseDuration = (duration) => {
    if (!duration) return 0;
    const match = duration.match(/(\d+)h?\s*(\d+)?m?/);
    if (match) {
      const hours = parseInt(match[1]) || 0;
      const minutes = parseInt(match[2]) || 0;
      return hours * 60 + minutes;
    }
    return 0;
  };

  const confirmDeleteLastContent = () => {
    showConfirm(
      'Esta es la única canción/vídeo en la lista. Las listas no pueden estar vacías. ¿Deseas eliminar la lista completa?',
      handleDeletePlaylist,
      'Última canción/vídeo en la lista',
      'Eliminar lista completa',
      'Cancelar'
    );
  };

  const removeContentFromPlaylist = async (contentId) => {
    try {
      const response = await axios.delete(`/api/playlists/${id}/content/${contentId}`, {
        withCredentials: true
      });
      setContents(contents.filter(c => c.id !== contentId));
      setPlaylist(response.data);
      showSuccess('Contenido eliminado de la lista');
    } catch (error) {
      console.error('Error al eliminar contenido:', error);
      showError('Error al eliminar el contenido');
    }
  };

  const handleRemoveContent = (contentId) => {
    if (contents.length === 1) {
      confirmDeleteLastContent();
      return;
    }

    showConfirm(
      '¿Estás seguro de que deseas eliminar este contenido de la lista?',
      () => removeContentFromPlaylist(contentId),
      'Eliminar contenido',
      'Eliminar',
      'Cancelar'
    );
  };

  const handleUpdatePlaylist = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.put(`/api/playlists/${id}`, {
        nombre: editName,
        descripcion: editDescription
      }, {
        withCredentials: true
      });

      setPlaylist(response.data);
      setIsEditing(false);
      showSuccess('Lista actualizada correctamente');
    } catch (error) {
      console.error('Error al actualizar lista:', error);
      showError('Error al actualizar la lista');
    }
  };

  const handleDeletePlaylist = async () => {
    return new Promise((resolve) => {
      showConfirm(
        '¿Estás seguro de que deseas eliminar esta lista? Esta acción no se puede deshacer.',
        async () => {
          try {
            await axios.delete(`/api/playlists/${id}`, {
              withCredentials: true
            });
            showSuccess('Lista eliminada correctamente');
            history.push('/playlists');
            resolve(true);
          } catch (error) {
            console.error('Error al eliminar playlist:', error);
            showError('Error al eliminar la lista');
            resolve(false);
          }
        },
        'Eliminar lista',
        'Eliminar',
        'Cancelar'
      );
    });
  };

  const openPlayer = (content) => {
    setSelectedContent(content);
    content.type === 'AUDIO' ? setIsAudioPlayerOpen(true) : setIsVideoPlayerOpen(true);
  };

  const handleContentClick = (content) => {
    if (content.isVipUnavailable || (content.vipOnly && !userProfile.vip)) {
      setSelectedVipContent(content);
      setShowVipModal(true);
      return;
    }
    openPlayer(content);
  };

  const handleVipUpgrade = () => {
    setShowVipModal(false);
    history.push('/suscripcion');
  };

  const handleClosePlayer = () => {
    setIsAudioPlayerOpen(false);
    setIsVideoPlayerOpen(false);
    setSelectedContent(null);
  };

  if (loading) {
    return (
      <div className="playlist-detail-page">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando lista...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return null;
  }

  const isPermanentFavoritos = playlist?.nombre === 'Favoritos' && playlist?.isPermanent;
  const sortedContents = getSortedContents();

  const editOverlayHandlers = createOverlayKeyboardHandlers(() => setShowEditModal(false));
  const deleteOverlayHandlers = createOverlayKeyboardHandlers(() => setShowDeleteConfirm(false));
  const editDialogHandlers = createDialogKeyboardHandlers(() => setShowEditModal(false));
  const deleteDialogHandlers = createDialogKeyboardHandlers(() => setShowDeleteConfirm(false));

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
      <button 
        className="floating-back-button" 
        onClick={() => history.push('/playlists')}
        aria-label="Volver a listas de reproducción"
      >
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
              <i className="fas fa-list"></i> Mi Lista de Reproducción
            </span>
            <h1 className="playlist-hero-title">{playlist.nombre}</h1>
            {playlist.descripcion && (
              <p className="playlist-hero-description">{playlist.descripcion}</p>
            )}
            <div className="playlist-hero-meta">
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
            <div className="playlist-hero-actions">
              {!isPermanentFavoritos && (
                <>
                  <button 
                    className="btn-edit" 
                    onClick={() => setShowEditModal(true)} 
                    title="Editar lista"
                    aria-label="Editar lista"
                  >
                    <i className="fas fa-edit"></i> Editar
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => setShowDeleteConfirm(true)} 
                    title="Eliminar lista"
                    aria-label="Eliminar lista"
                  >
                    <i className="fas fa-trash"></i> Eliminar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="playlist-detail-container">
        <div className="playlist-content">
          <div className="playlist-controls">
            <div className="sort-controls">
              <label htmlFor="sort-select">Ordenar por:</label>
              <select 
                id="sort-select" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Ordenar contenidos por"
                className="sort-select"
              >
                <option value="addedDate">Fecha de adición</option>
                <option value="title">Título</option>
                <option value="duration">Duración</option>
              </select>
            </div>
          </div>

          {sortedContents.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-film" aria-hidden="true"></i>
              <h2>Esta lista está vacía</h2>
              <p>Añade contenidos navegando por el catálogo y haciendo clic en el botón "+"</p>
              <button 
                className="browse-btn" 
                onClick={() => history.push('/usuario')}
                aria-label="Explorar catálogo de contenidos"
              >
                <i className="fas fa-search" aria-hidden="true"></i> Explorar Contenidos
              </button>
            </div>
          ) : (
            <div className="playlist-contents">
              {sortedContents.map(content => (
                <ContentCard
                  key={content.id}
                  content={content}
                  onContentClick={handleContentClick}
                  onRemove={handleRemoveContent}
                  showRemove={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div 
          className="modal-overlay" 
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowEditModal(false);
            }
          }}
          onKeyDown={editOverlayHandlers.onOverlayKeyDown}
          onKeyUp={editOverlayHandlers.onOverlayKeyUp}
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal de edición"
        >
          <div 
            className="modal-content" 
            onKeyDown={editDialogHandlers.onDialogKeyDown}
            onKeyUp={editDialogHandlers.onDialogKeyUp}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            tabIndex={-1}
          >
            <div className="modal-header">
              <h2 id="edit-modal-title">Editar Lista</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowEditModal(false)}
                aria-label="Cerrar modal de edición"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={handleUpdatePlaylist}>
              <div className="form-group">
                <label htmlFor="edit-name">Nombre *</label>
                <input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={50}
                  required
                  aria-required="true"
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-description">Descripción *</label>
                <textarea
                  id="edit-description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  maxLength={200}
                  rows={3}
                  aria-label="Descripción de la lista"
                />
              </div>
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowEditModal(false)}
                  aria-label="Cancelar edición"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-save"
                  aria-label="Guardar cambios"
                >
                  <i className="fas fa-save" aria-hidden="true"></i> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="modal-overlay" 
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShowDeleteConfirm(false);
            }
          }}
          onKeyDown={deleteOverlayHandlers.onOverlayKeyDown}
          onKeyUp={deleteOverlayHandlers.onOverlayKeyUp}
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal de confirmación"
        >
          <div 
            className="modal-content confirm-modal" 
            onKeyDown={deleteDialogHandlers.onDialogKeyDown}
            onKeyUp={deleteDialogHandlers.onDialogKeyUp}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            tabIndex={-1}
          >
            <div className="modal-header">
              <h2 id="delete-modal-title">¿Eliminar lista?</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowDeleteConfirm(false)}
                aria-label="Cerrar modal de confirmación"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <p>Esta acción no se puede deshacer. Se eliminará la lista "{playlist.nombre}" y todos sus contenidos.</p>
            <div className="modal-actions">
              <button 
                className="btn-cancel" 
                onClick={() => setShowDeleteConfirm(false)}
                aria-label="Cancelar eliminación"
              >
                Cancelar
              </button>
              <button 
                className="btn-delete" 
                onClick={handleDeletePlaylist}
                aria-label="Confirmar eliminación de lista"
              >
                <i className="fas fa-trash" aria-hidden="true"></i> Eliminar
              </button>
            </div>
          </div>
        </div>
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

      {/* VIP Upgrade Modal */}
      <VipUpgradeModal
        isOpen={showVipModal}
        onClose={() => setShowVipModal(false)}
        onConfirm={handleVipUpgrade}
        contentTitle={selectedVipContent?.titulo}
      />

      {/* Reproductores */}
      {isAudioPlayerOpen && selectedContent && (
        <AudioPlayer
          audioFileName={selectedContent.videoUrl}
          onClose={handleClosePlayer}
          title={selectedContent.titulo}
          contentId={selectedContent.id}
        />
      )}

      {isVideoPlayerOpen && selectedContent && (
        <VideoPlayer
          videoUrl={selectedContent.videoUrl}
          onClose={handleClosePlayer}
          title={selectedContent.titulo}
          contentId={selectedContent.id}
        />
      )}
    </div>
  );
}

export default PlaylistDetailPage;
