import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import MobileHeader from '../../../components/mobile/MobileHeader';
import { handleLogout as logoutCsrf } from '../../../auth/logout';
import PlaylistCard from '../../../components/PlaylistCard';
import './PlaylistsPage.css';
import CustomModal from '../../../components/CustomModal';
import { useModal } from '../../../utils/useModal';
import axios from '../../../api/axiosConfig';

function PlaylistsPage() {
  const history = useHistory();
  const location = useLocation();
  const { modalState, closeModal, showSuccess, showError, showWarning } = useModal();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
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

  useEffect(() => {
    console.log('PlaylistsPage montada o actualizada - recargando datos');
    fetchPlaylists();
    loadUserProfile();
  }, [location.key]); // Se ejecuta cada vez que cambia la navegación

  const loadUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile', {
        withCredentials: true
      });
      const profileData = response.data;
      const updatedProfile = {
        picture: getImageUrl(profileData.picture),
        vip: profileData.vip || false
      };
      setUserProfile(updatedProfile);
      console.log('🖼️ Profile picture URL (PlaylistsPage):', updatedProfile.picture);
    } catch (error) {
      console.error('Error al cargar el perfil del usuario:', error);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const response = await axios.get('/api/playlists', {
        withCredentials: true
      });

      const data = response.data;
      console.log('Playlists recibidas:', data);
      data.forEach(p => {
        console.log(`  - ${p.nombre}: ${p.items ? p.items.length : 0} items`, p.items);
      });
      
      // Separar la lista "Favoritos" y las demás
      const favoritosPlaylist = data.find(p => p.nombre === 'Favoritos' && p.isPermanent);
      const otherPlaylists = data.filter(p => !(p.nombre === 'Favoritos' && p.isPermanent));
      
      // Si existe "Favoritos", ponerla primero
      if (favoritosPlaylist) {
        setPlaylists([favoritosPlaylist, ...otherPlaylists]);
      } else {
        setPlaylists(data);
      }
    } catch (error) {
      console.error('Error al cargar playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim()) {
      showError('Por favor, ingresa un nombre para la lista');
      return;
    }

    try {
      const response = await axios.post('/api/playlists', {
        nombre: newPlaylistName,
        descripcion: newPlaylistDescription || ''
      }, {
        withCredentials: true
      });

      if (response.status === 200 || response.status === 201) {
        showSuccess('Lista de reproducción creada exitosamente');
        setShowCreateModal(false);
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        fetchPlaylists(); // Recargar las listas
      } else {
        showError('Error al crear la lista de reproducción');
      }
    } catch (error) {
      console.error('Error al crear playlist:', error);
      showError('Error al crear la lista de reproducción');
    }
  };

  const handlePlaylistClick = (playlistId) => {
    history.push(`/playlists/${playlistId}`);
  };

  if (loading) {
    return (
      <div className="playlists-page">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Cargando listas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="playlists-page">
      {Capacitor.isNativePlatform() && (
        <MobileHeader
          userProfile={userProfile}
          handleLogout={handleLogout}
          showSearch={false}
          showFilters={false}
          showNotifications={true}
        />
      )}
      <div className="playlists-header">
        <div className="playlists-header-left">
          <button className="back-button" onClick={() => history.push('/usuario')}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="header-content">
            <div className="playlist-icon-large">
              <i className="fas fa-list"></i>
            </div>
            <div>
              <h1>Mis Listas de Reproducción</h1>
              <p className="playlists-subtitle">
                <span>{playlists.length}</span> {playlists.length === 1 ? 'lista creada' : 'listas creadas'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {playlists.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-list"></i>
          <h2>No tienes listas de reproducción</h2>
          <p>Añade contenidos a tus listas presionando el botón + en cualquier contenido</p>
        </div>
      ) : (
        <div className="playlists-grid">
          {playlists.map(playlist => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onClick={() => handlePlaylistClick(playlist.id)}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <button
          className="modal-overlay" 
          onClick={() => setShowCreateModal(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowCreateModal(false);
            }
          }}
          aria-label="Cerrar modal"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'default',
            display: 'block',
            width: '100%',
            height: '100%'
          }}
        >
          <div 
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <h2 id="modal-title">Crear Nueva Lista</h2>
              <button className="modal-close" onClick={(e) => {
                e.stopPropagation();
                setShowCreateModal(false);
              }}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={(e) => {
              e.stopPropagation();
              handleCreatePlaylist(e);
            }}>
              <div className="form-group">
                <label htmlFor="playlist-name">Nombre *</label>
                <input
                  id="playlist-name"
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Ej: Mis Favoritos, Para Ver Luego..."
                  maxLength={50}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="playlist-description">Descripción (opcional)</label>
                <textarea
                  id="playlist-description"
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Describe tu lista de reproducción..."
                  maxLength={200}
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateModal(false);
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-create" onClick={(e) => e.stopPropagation()}>
                  <i className="fas fa-plus"></i> Crear Lista
                </button>
              </div>
            </form>
          </div>
        </button>
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

export default PlaylistsPage;
