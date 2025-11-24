import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PlaylistCard from '../../../components/PlaylistCard';
import './PlaylistsPage.css';
import CustomModal from '../../../components/CustomModal';
import { useModal } from '../../../utils/useModal';

function PlaylistsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { modalState, closeModal, showSuccess, showError, showWarning } = useModal();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

  useEffect(() => {
    console.log('PlaylistsPage montada o actualizada - recargando datos');
    fetchPlaylists();
  }, [location.key]); // Se ejecuta cada vez que cambia la navegación

  const fetchPlaylists = async () => {
    try {
      const response = await fetch('/api/playlists', { credentials: 'include' });

      if (response.ok) {
        const data = await response.json();
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
      } else {
        console.error('Error fetching playlists');
      }
    } catch (error) {
      console.error('Error:', error);
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
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          nombre: newPlaylistName,
          descripcion: newPlaylistDescription || ''
        })
      });

      if (response.ok) {
        showSuccess('Lista de reproducción creada exitosamente');
        setShowCreateModal(false);
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        fetchPlaylists(); // Recargar las listas
      } else {
        showError('Error al crear la lista de reproducción');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al crear la lista de reproducción');
    }
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/playlists/${playlistId}`);
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
      <div className="playlists-header">
        <div className="playlists-header-left">
          <button className="back-button" onClick={() => navigate('/usuario')}>
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
