import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import '../../../creator/CreatorDashboard.css';
import '../../user/PlaylistDetailPage/PlaylistDetailPage.css';
import CreatorTabs from '../../../creator/components/CreatorTabs';
import CustomModal from '../../../components/CustomModal';
import { useModal } from '../../../utils/useModal';

function CreatorPlaylistDetailPage() {
  const { id } = useParams();
  const history = useHistory();
  const { modalState, closeModal, showSuccess, showError, showWarning, showConfirm } = useModal();
  const [playlist, setPlaylist] = useState(null);
  const [contents, setContents] = useState([]);
  const [allContents, setAllContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // No usamos localStorage para el usuario; backend valida por cookie
  const currentUser = null;

  useEffect(() => {
    fetchAllContents();
    fetchPlaylistDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (playlist && playlist.items && allContents.length > 0) {
      fetchContents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist, allContents]);

  const fetchAllContents = async () => {
    try {
      const response = await fetch('/api/creator/contents', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAllContents(data);
      }
    } catch (error) {
      console.error('Error fetching all contents:', error);
    }
  };

  const fetchPlaylistDetails = async () => {
    try {
      const response = await fetch(`/api/creator/playlists/${id}`, { credentials: 'include' });

      if (response.ok) {
        const data = await response.json();
        setPlaylist(data);
        setEditName(data.nombre);
        setEditDescription(data.descripcion || '');
      } else if (response.status === 403) {
        showWarning('No tienes permiso para ver esta lista');
        history.push('/creator/playlists');
      } else {
        showError('Error al cargar la lista');
        history.push('/creator/playlists');
      }
    } catch (error) {
      console.error('Error:', error);
      history.push('/creator/playlists');
    } finally {
      setLoading(false);
    }
  };

  const fetchContents = async () => {
    if (!playlist || !playlist.items || playlist.items.length === 0) {
      setContents([]);
      return;
    }

    try {
      const playlistContents = playlist.items
        .map(item => {
          const content = allContents.find(c => c.id === item.contentId);
          if (content) {
            return {
              id: content.id,
              title: content.title,
              type: content.type,
              description: content.description,
              coverFileName: content.coverFileName,
              audioFileName: content.audioFileName,
              durationMinutes: content.durationMinutes,
              tags: content.tags || [],
              addedAt: item.addedAt
            };
          }
          console.warn('Content not found for id:', item.contentId);
          return null;
        })
        .filter(c => c !== null);
      
      setContents(playlistContents);
    } catch (error) {
      console.error('Error fetching contents:', error);
    }
  };

  const handleRemoveContent = (contentId) => {
    showConfirm(
      '¿Estás seguro de que deseas eliminar este contenido de la lista?',
      async () => {
        try {
          const response = await fetch(`/api/creator/playlists/${id}/content/${contentId}`, {
            method: 'DELETE',
            credentials: 'include'
          });

          if (response.status === 409) {
            showError('No se puede eliminar el último contenido de la lista');
            return;
          }

          if (response.ok) {
            await fetchPlaylistDetails();
            showSuccess('Contenido eliminado de la lista');
          } else {
            showError('Error al eliminar el contenido');
          }
        } catch (error) {
          console.error('Error:', error);
          showError('Error al eliminar el contenido');
        }
      },
      'Eliminar contenido',
      'Eliminar',
      'Cancelar'
    );
  };

  const handleUpdatePlaylist = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/creator/playlists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre: editName,
          descripcion: editDescription
        })
      });

      if (response.status === 409) {
        showError('Ya existe una lista con ese nombre');
        return;
      }

      if (response.ok) {
        const updated = await response.json();
        setPlaylist(updated);
        setShowEditModal(false);
        showSuccess('Lista actualizada correctamente');
      } else {
        showError('Error al actualizar la lista');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al actualizar la lista');
    }
  };

  const handleToggleVisibility = async () => {
    try {
      const response = await fetch(`/api/creator/playlists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ visible: !playlist.visible })
      });

      if (response.ok) {
        const updated = await response.json();
        setPlaylist(updated);
        showSuccess(`Lista ahora ${updated.visible ? 'visible' : 'oculta'}`);
      } else {
        showError('Error al cambiar visibilidad');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al cambiar visibilidad');
    }
  };

  const handleDeletePlaylist = () => {
    setShowDeleteConfirm(false);
    showConfirm(
      '¿Estás seguro de que deseas eliminar esta lista? Esta acción no se puede deshacer.',
      async () => {
        try {
          const response = await fetch(`/api/creator/playlists/${id}`, {
            method: 'DELETE',
            credentials: 'include'
          });

          if (response.ok) {
            showSuccess('Lista eliminada correctamente');
            history.push('/creator/playlists');
          } else {
            showError('Error al eliminar la lista');
          }
        } catch (error) {
          console.error('Error:', error);
          showError('Error al eliminar la lista');
        }
      },
      'Eliminar lista',
      'Eliminar',
      'Cancelar'
    );
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-box">
          <CreatorTabs />
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando lista...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return null;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-box">
        <CreatorTabs />
        
        {/* Header con información de la lista */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <button 
                className="btn btn-neutral" 
                onClick={() => history.push('/creator/playlists')}
                style={{ marginBottom: '12px' }}
              >
                <i className="fas fa-arrow-left"></i> Volver a Listas
              </button>
              <h2 className="section-title" style={{ margin: '0 0 8px 0' }}>{playlist.nombre}</h2>
              {playlist.descripcion && (
                <p style={{ color: 'var(--creator-text-secondary)', margin: '0 0 12px 0' }}>
                  {playlist.descripcion}
                </p>
              )}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '14px', color: 'var(--creator-text-muted)' }}>
                <span><i className="fas fa-music"></i> {contents.length} {contents.length === 1 ? 'contenido' : 'contenidos'}</span>
                <span><i className="fas fa-calendar"></i> {new Date(playlist.createdAt).toLocaleDateString()}</span>
                <span className={playlist.visible ? 'text-success' : 'text-muted'}>
                  <i className={`fas fa-eye${playlist.visible ? '' : '-slash'}`}></i> {playlist.visible ? 'Visible' : 'Oculta'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-neutral" onClick={handleToggleVisibility}>
                <i className={`fas fa-eye${playlist.visible ? '-slash' : ''}`}></i> {playlist.visible ? 'Ocultar' : 'Mostrar'}
              </button>
              <button className="btn btn-neutral" onClick={() => setShowEditModal(true)}>
                <i className="fas fa-edit"></i> Editar
              </button>
              <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
                <i className="fas fa-trash"></i> Eliminar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de contenidos */}
        {contents.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <i className="fas fa-folder-open" style={{ fontSize: '64px', color: 'var(--creator-text-muted)', marginBottom: '16px' }}></i>
            <h3 style={{ color: 'var(--creator-text-primary)', marginBottom: '8px' }}>Esta lista está vacía</h3>
            <p style={{ color: 'var(--creator-text-muted)', marginBottom: '24px' }}>
              Añade contenidos desde el catálogo haciendo clic en el botón "+" de cada contenido
            </p>
            <button className="btn btn-primary" onClick={() => history.push('/creator')}>
              <i className="fas fa-arrow-left"></i> Ir a Mis Contenidos
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Portada</th>
                  <th>Título</th>
                  <th>Tipo</th>
                  <th className="hide-sm">Duración</th>
                  <th className="hide-xs">Tags</th>
                  <th className="hide-sm">Añadido</th>
                  <th className="actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {contents.map((content) => (
                  <tr key={content.id}>
                    <td>
                      {(() => {
                        const coverSrc = content.coverFileName ? `/cover/${content.coverFileName}` : null;
                        if (coverSrc) {
                          return (
                            <img
                              src={coverSrc}
                              alt={`Carátula de ${content.title}`}
                              loading="lazy"
                              className="thumbnail"
                            />
                          );
                        }
                        return (
                          <span style={{ fontSize: 22 }}>
                            {content.type === 'VIDEO' ? '🎬' : '🎧'}
                          </span>
                        );
                      })()}
                      {content.type === 'AUDIO' && content.audioFileName && (
                        <div className="audio-chip" title={content.audioFileName}>
                          {content.audioFileName}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>
                        <strong>{content.title}</strong>
                        {content.description && (
                          <div style={{ fontSize: '12px', color: 'var(--creator-text-muted)', marginTop: '4px' }}>
                            {content.description.length > 60 
                              ? content.description.substring(0, 60) + '...' 
                              : content.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{content.type}</td>
                    <td className="hide-sm">{content.durationMinutes ? `${content.durationMinutes} min` : 'N/A'}</td>
                    <td className="hide-xs">{(content.tags || []).join(', ') || '-'}</td>
                    <td className="hide-sm">{new Date(content.addedAt).toLocaleDateString()}</td>
                    <td className="actions">
                      <button
                        onClick={() => handleRemoveContent(content.id)}
                        className="btn btn-danger"
                        title="Eliminar de la lista"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de edición */}
        {showEditModal && (
          <div 
            className="modal-overlay" 
            onClick={() => setShowEditModal(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setShowEditModal(false); }}
            role="button"
            tabIndex={0}
            aria-label="Cerrar modal"
          >
            <div 
              className="modal-content" 
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <h2>Editar Lista</h2>
                <button className="modal-close" onClick={() => setShowEditModal(false)}>
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
                    className="input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-description">Descripción</label>
                  <textarea
                    id="edit-description"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    maxLength={200}
                    rows={3}
                    className="textarea"
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-neutral" onClick={() => setShowEditModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-save"></i> Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteConfirm && (
          <div 
            className="modal-overlay" 
            onClick={() => setShowDeleteConfirm(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setShowDeleteConfirm(false); }}
            role="button"
            tabIndex={0}
            aria-label="Cerrar modal"
          >
            <div 
              className="modal-content confirm-modal" 
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <h2>¿Eliminar lista?</h2>
                <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <p>Esta acción no se puede deshacer. Se eliminará la lista "{playlist.nombre}" y su configuración.</p>
              <div className="modal-actions">
                <button className="btn btn-neutral" onClick={() => setShowDeleteConfirm(false)}>
                  Cancelar
                </button>
                <button className="btn btn-danger" onClick={handleDeletePlaylist}>
                  <i className="fas fa-trash"></i> Eliminar
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
      </div>
    </div>
  );
}

export default CreatorPlaylistDetailPage;