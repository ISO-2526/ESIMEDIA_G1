import React, { useState, useEffect } from 'react';
import './AddToPlaylistModal.css';
import CustomModal from './CustomModal';
import { useModal } from '../utils/useModal';

import axios from '../api/axiosConfig';

function AddToPlaylistModal({ isOpen, onClose, content }) {
  const { modalState, closeModal, showSuccess, showError, showConfirm } = useModal();
  const [playlists, setPlaylists] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen]);

  const fetchPlaylists = async () => {
    try {
      const response = await axios.get('/api/playlists', { withCredentials: true });
      const data = response.data;

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
      console.error('Error fetching playlists:', error);
    }
  };

  const isContentInPlaylist = (playlist) => {
    if (!playlist.items || !content) return false;
    return playlist.items.some(item => item.contentId === content.id);
  };

  const handlePlaylistClick = (playlist) => {
    const isInPlaylist = isContentInPlaylist(playlist);

    if (isInPlaylist) {
      // Eliminar de la lista
      showConfirm(
        `¿Eliminar "${content.titulo}" de la lista "${playlist.nombre}"?`,
        async () => {
          await removeFromPlaylist(playlist.id);
        },
        'Eliminar de la lista',
        'Eliminar',
        'Cancelar'
      );
    } else {
      // Añadir a la lista
      addToPlaylist(playlist.id);
    }
  };

  const addToPlaylist = async (playlistId) => {
    try {
      await axios.post(`/api/playlists/${playlistId}/content/${content.id}`, {}, {
        withCredentials: true
      });

      showSuccess(`"${content.titulo}" añadido a la lista`);
      fetchPlaylists(); // Actualizar la lista
    } catch (error) {
      console.error('Error:', error);
      showError('Error al añadir el contenido');
    }
  };

  const removeFromPlaylist = async (playlistId) => {
    try {
      await axios.delete(`/api/playlists/${playlistId}/content/${content.id}`, {
        withCredentials: true
      });

      showSuccess('Contenido eliminado de la lista');
      fetchPlaylists(); // Actualizar la lista
    } catch (error) {
      console.error('Error:', error);
      showError('Error al eliminar el contenido');
    }
  };

  const createFavoritosPlaylist = async () => {
    try {
      await axios.post('/api/playlists', {
        nombre: 'Favoritos',
        descripcion: 'Lista permanente de favoritos',
        isPermanent: true
      }, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });

      showSuccess('Lista de Favoritos creada');
      fetchPlaylists();
    } catch (error) {
      console.error('Error:', error);
      const errorData = error.response?.data;
      if (errorData?.error && errorData.error.includes('Ya existe')) {
        showError('Ya tienes una lista de Favoritos');
      } else {
        showError('Error al crear la lista de Favoritos');
      }
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();

    if (!newPlaylistName.trim()) {
      showError('Por favor, ingresa un nombre para la lista');
      return;
    }

    try {
      await axios.post('/api/playlists', {
        nombre: newPlaylistName,
        descripcion: newPlaylistDescription || ''
      }, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });

      showSuccess('Lista creada exitosamente');
      setShowCreateForm(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      fetchPlaylists();
    } catch (error) {
      console.error('Error:', error);
      showError('Error al crear la lista');
    }
  };

  const getFilteredPlaylists = () => {
    if (!searchTerm.trim()) return playlists;

    const search = searchTerm.toLowerCase();
    return playlists.filter(playlist =>
      playlist.nombre.toLowerCase().includes(search) ||
      (playlist.descripcion && playlist.descripcion.toLowerCase().includes(search))
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="add-to-playlist-modal-overlay"
        onClick={onClose}
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        role="button"
        tabIndex={0}
        aria-label="Cerrar modal"
      >
        <div
          className="add-to-playlist-modal"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="add-to-playlist-header">
            <h2>Añadir a lista</h2>
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="add-to-playlist-body">
            {/* Búsqueda */}
            <div className="playlist-search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Busca una lista"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Botón para crear Favoritos si no existe */}
            {!playlists.some(p => p.nombre === 'Favoritos' && p.isPermanent) && (
              <button
                className="new-playlist-btn favoritos-create-btn"
                onClick={createFavoritosPlaylist}
              >
                <i className="fas fa-heart"></i>
                Crear lista de Favoritos
              </button>
            )}

            {/* Botón Nueva Lista */}
            {!showCreateForm && (
              <button
                className="new-playlist-btn"
                onClick={() => setShowCreateForm(true)}
              >
                <i className="fas fa-plus"></i>
                Nueva lista
              </button>
            )}

            {/* Formulario para crear lista */}
            {showCreateForm && (
              <div className="create-playlist-form">
                <div className="form-header">
                  <h3>Crear nueva lista</h3>
                  <button onClick={() => setShowCreateForm(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <form onSubmit={handleCreatePlaylist}>
                  <input
                    type="text"
                    placeholder="Nombre de la lista"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    maxLength={50}
                  />
                  <textarea
                    placeholder="Descripción (opcional)"
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    maxLength={200}
                    rows={3}
                  />
                  <div className="form-actions">
                    <button type="button" onClick={() => setShowCreateForm(false)}>
                      Cancelar
                    </button>
                    <button type="submit">
                      <i className="fas fa-check"></i> Crear
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de playlists */}
            <div className="playlists-list">
              {getFilteredPlaylists().length === 0 ? (
                <div className="no-playlists">
                  <i className="fas fa-list"></i>
                  <p>{searchTerm ? 'No se encontraron listas' : 'No tienes listas creadas'}</p>
                </div>
              ) : (
                getFilteredPlaylists().map(playlist => {
                  const isInPlaylist = isContentInPlaylist(playlist);
                  const itemCount = playlist.items ? playlist.items.length : 0;
                  const isFavoritos = playlist.nombre === 'Favoritos' && playlist.isPermanent;

                  return (
                    <div
                      key={playlist.id}
                      className={`playlist-item ${isInPlaylist ? 'in-playlist' : ''} ${isFavoritos ? 'favoritos-permanent' : ''}`}
                      onClick={() => handlePlaylistClick(playlist)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlaylistClick(playlist); } }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${isInPlaylist ? 'Eliminar de' : 'Añadir a'} ${playlist.nombre}`}
                    >
                      <div className="playlist-item-icon">
                        <i className={isFavoritos ? "fas fa-heart" : "fas fa-list"}></i>
                      </div>
                      <div className="playlist-item-info">
                        <h4>{playlist.nombre}</h4>
                        <p>{itemCount} {itemCount === 1 ? 'contenido' : 'contenidos'}</p>
                      </div>
                      <div className="playlist-item-check">
                        {isInPlaylist && (
                          <i className="fas fa-check-circle"></i>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
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
    </>
  );
}

export default AddToPlaylistModal;
