import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatorTopBar from '../../../creator/components/CreatorTopBar';
import CreatorTabs from '../../../creator/components/CreatorTabs';
import ContentFilters from '../../../creator/components/ContentFilters';
import ContentList from '../../../creator/components/ContentList';
import ContentForm from '../../../creator/components/ContentForm';
import { ContentService } from '../../../creator/ContentService';
import '../../../creator/CreatorDashboard.css';
import CustomModal from '../../../components/CustomModal';
import { useModal } from '../../../utils/useModal';
import { handleLogout as logoutCsrf } from '../../../auth/logout';

export default function ContentCreatorDashboard() {
  const navigate = useNavigate();
  const { modalState, closeModal, showSuccess, showError, showConfirm } = useModal();
  const [creatorPhoto, setCreatorPhoto] = useState('/pfp/avatar1.png');
  const [menuOpen, setMenuOpen] = useState(false);
  const [contents, setContents] = useState([]);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterTag, setFilterTag] = useState('ALL');
  const [filterState, setFilterState] = useState('ALL');
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creatorAlias, setCreatorAlias] = useState('');
  const [creatorContentType, setCreatorContentType] = useState('');
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [creatorPlaylists, setCreatorPlaylists] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');

  // Sesión basada en cookie
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/validate-token', { credentials: 'include' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.error('Error obteniendo sesión:', e);
      return null;
    }
  };

  useEffect(() => {
    loadCreatorProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cerrar el menú cuando se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.creator-user-menu-container')) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [menuOpen]);

  const loadCreatorProfile = async () => {
    try {
      const session = await fetchSession();
      const email = session?.email;
      if (!email) {
        console.error('Sesión inválida: no hay email');
        return;
      }

      const response = await fetch(`/api/creators/profile?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const profileData = await response.json();
        if (profileData.alias) setCreatorAlias(profileData.alias);
        if (profileData.contentType) setCreatorContentType(String(profileData.contentType).toUpperCase());
        if (profileData.picture) {
          setCreatorPhoto(profileData.picture);
        } else {
          setCreatorPhoto('/pfp/avatar1.png');
        }
      } else {
        console.error('Error al obtener el perfil desde la BD:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error al cargar el perfil del creador desde la BD:', error);
    }
  };

  async function loadContents() {
    try {
      const data = await ContentService.getAll();
      console.log('Contenidos cargados:', data);
      setContents(data);
    } catch (err) {
      console.error(err);
      showError('Error al cargar los contenidos');
    }
  }

  useEffect(() => {
    loadContents();
    loadCreatorPlaylists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCreatorPlaylists() {
    try {
      const response = await fetch('/api/creator/playlists/all', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setCreatorPlaylists(data);
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setMessage('');
  }

  function closeForm() {
    resetForm();
    setShowForm(false);
  }

  const handleLogout = () => logoutCsrf('/login', navigate);

  // Add these helper functions before handleFormSubmit
  const uploadAudioFile = async (audioFile) => {
    const formData = new FormData();
    formData.append('file', audioFile);

    const uploadResponse = await fetch('/api/upload/audio', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || 'Error al subir el archivo de audio');
    }

    const uploadResult = await uploadResponse.json();
    return uploadResult.filename;
  };

  const createContentBody = (payload, audioFileName, creatorAlias) => ({
    type: payload.type,
    title: payload.title,
    description: payload.description,
    tags: payload.tags,
    durationMinutes: payload.durationMinutes,
    edadMinima: Number(payload.edadMinima),
    availableUntil: payload.availableUntil,
    vipOnly: payload.vipOnly || false,
    url: payload.url,
    resolution: payload.resolution,
    audioFileName: audioFileName,
    coverFileName: payload.coverFileName || null,
    creatorAlias: creatorAlias || 'anon',
  });

  const createUpdatePayload = (payload) => ({
    title: payload.title,
    description: payload.description,
    tags: payload.tags,
    durationMinutes: payload.durationMinutes,
    edadMinima: Number(payload.edadMinima),
    availableUntil: payload.availableUntil,
    coverFileName: payload.coverFileName || null,
    vipOnly: payload.vipOnly ?? false,
    state: payload.state || 'PRIVADO',
  });

  // Refactored handleFormSubmit
  async function handleFormSubmit(payload) {
    try {
      let audioFileName = null;

      // Handle audio file upload if present
      if (payload.audioFile && payload.type === 'AUDIO') {
        try {
          audioFileName = await uploadAudioFile(payload.audioFile);
          console.log('Archivo de audio subido exitosamente:', audioFileName);
        } catch (uploadError) {
          console.error('Error al subir el archivo:', uploadError);
          showError(uploadError.message || 'Error al subir el archivo de audio');
          return;
        }
      }

      // Update or create content
      if (editingId) {
        const updatePayload = createUpdatePayload(payload);
        await ContentService.update(editingId, updatePayload);
        setMessage('Contenido actualizado correctamente');
      } else {
        const body = createContentBody(payload, audioFileName, creatorAlias);
        await ContentService.create(body);
        const successMsg = audioFileName
          ? 'Contenido creado correctamente. Archivo de audio subido.'
          : 'Contenido creado correctamente';
        setMessage(successMsg);
      }

      await loadContents();
      closeForm();
    } catch (err) {
      console.error(err);
      showError(err?.message || 'Error al guardar el contenido');
    }
  }

  async function handleDelete(id) {
    showConfirm(
      '¿Estás seguro de que deseas eliminar este contenido?',
      async () => {
        try {
          await ContentService.delete(id);
          await loadContents();
          showSuccess('Contenido eliminado correctamente');
        } catch (err) {
          console.error(err);
          showError(err?.message || 'Error al eliminar el contenido');
        }
      },
      'Eliminar contenido',
      'Eliminar',
      'Cancelar'
    );
  }

  async function handlePublish(id) {
    const content = contents.find((c) => c.id === id);
    if (!content) return;
    try {
      await ContentService.update(id, { ...content, state: 'PUBLICO' });
      await loadContents();
      showSuccess('Contenido publicado correctamente');
    } catch (err) {
      console.error(err);
      showError(err?.message || 'Error al publicar contenido');
    }
  }

  async function handleUnpublish(id) {
    const content = contents.find((c) => c.id === id);
    if (!content) return;
    try {
      await ContentService.update(id, { ...content, state: 'PRIVADO' });
      await loadContents();
      showSuccess('Contenido despublicado correctamente');
    } catch (err) {
      console.error(err);
      showError(err?.message || 'Error al despublicar contenido');
    }
  }

  function handleAddToPlaylist(content) {
    setSelectedContent(content);
    setSelectedPlaylistId('');
    setShowAddToPlaylistModal(true);
  }

  async function handleConfirmAddToPlaylist() {
    if (!selectedPlaylistId || !selectedContent) {
      showError('Selecciona una lista');
      return;
    }

    try {
      const response = await fetch(`/api/creator/playlists/${selectedPlaylistId}/content/${selectedContent.id}`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.status === 409) {
        showError('Este contenido ya está en la lista');
        return;
      }

      if (response.ok) {
        showSuccess('Contenido añadido a la lista');
        setShowAddToPlaylistModal(false);
        setSelectedContent(null);
        setSelectedPlaylistId('');
        await loadCreatorPlaylists();
      } else {
        showError('Error al añadir contenido a la lista');
      }
    } catch (error) {
      console.error('Error:', error);
      showError('Error al añadir contenido a la lista');
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contents.filter((c) => {
      if (filterType !== 'ALL' && c.type !== filterType) return false;
      if (filterTag !== 'ALL' && !(c.tags || []).includes(filterTag)) return false;
      if (filterState !== 'ALL' && c.state !== filterState) return false;
      if (!q) return true;
      return (
        String(c.title).toLowerCase().includes(q) ||
        String(c.description || '').toLowerCase().includes(q)
      );
    });
  }, [contents, query, filterType, filterTag, filterState]);

  return (
    <div className="dashboard-container" style={{ position: 'relative' }}>
      <div className="dashboard-box">
        <CreatorTopBar
          photoUrl={creatorPhoto}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen(m => !m)}
          onLogout={handleLogout}
          onViewProfile={() => navigate('/creator/profile')}
          onEditProfile={() => navigate('/creator/profile/edit')}
        />

        <h2 className="section-title">Panel del creador</h2>
        
        <CreatorTabs />
        
        <p>Gestiona tus contenidos: crea, edita o elimina.</p>

        <ContentFilters
          value={{ query, type: filterType, tag: filterTag, state: filterState }}
          onChange={({ query: q, type, tag, state }) => {
            setQuery(q);
            setFilterType(type);
            setFilterTag(tag);
            setFilterState(state);
          }}
          onNew={openCreateForm}
        />

        <ContentList
          items={filtered}
          onEdit={(id) => {
            setEditingId(id);
            setShowForm(true);
          }}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onDelete={handleDelete}
          onAddToPlaylist={handleAddToPlaylist}
          creatorContentType={creatorContentType}
        />

        {showForm && (
          <ContentForm
            mode={editingId ? 'edit' : 'create'}
            initialValue={editingId ? contents.find((c) => c.id === editingId) : null}
            creatorContentType={creatorContentType}
            onSubmit={handleFormSubmit}
            onCancel={closeForm}
          />
        )}

        {message && <output className="status-ok">{message}</output>}
      </div>

      {/* Modal para añadir a lista */}
      {showAddToPlaylistModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowAddToPlaylistModal(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowAddToPlaylistModal(false); }}
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
              <h2>Añadir a lista</h2>
              <button className="modal-close" onClick={() => setShowAddToPlaylistModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <p>Selecciona la lista para añadir "{selectedContent?.title}"</p>
            <div className="form-group">
              <label htmlFor="playlist-select">Lista:</label>
              <select
                id="playlist-select"
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                className="input"
              >
                <option value="">-- Seleccionar lista --</option>
                {creatorPlaylists.map(playlist => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.nombre} ({playlist.items?.length || 0} contenidos)
                  </option>
                ))}
              </select>
            </div>
            {creatorPlaylists.length === 0 && (
              <p style={{ color: 'var(--creator-text-muted)', fontSize: '0.9em' }}>
                No tienes listas creadas. <a href="/creator/playlists" style={{ color: 'var(--creator-accent)' }}>Crear una lista</a>
              </p>
            )}
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowAddToPlaylistModal(false)}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn-save" 
                onClick={handleConfirmAddToPlaylist}
                disabled={!selectedPlaylistId}
              >
                <i className="fas fa-plus"></i> Añadir
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
  );
}

