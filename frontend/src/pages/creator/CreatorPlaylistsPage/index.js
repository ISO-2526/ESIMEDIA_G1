import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import '../../../creator/CreatorDashboard.css';
import CreatorTabs from '../../../creator/components/CreatorTabs';
import CreatorTopBar from '../../../creator/components/CreatorTopBar';
import CustomModal from '../../../components/CustomModal';
import { useModal } from '../../../utils/useModal';
import { handleLogout as logoutCsrf } from '../../../auth/logout';

function CreatorPlaylistsPage() {
  const history = useHistory();
  const { modalState, closeModal, showError, showWarning, showSuccess } = useModal();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [visible, setVisible] = useState(true);
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [creatorPhoto, setCreatorPhoto] = useState('/pfp/avatar1.png');

  // Cargar foto de perfil
  const loadCreatorPhoto = async () => {
    try {
      const res = await fetch('/api/creators/profile', { credentials: 'include' });
      if (res.ok) {
        const profile = await res.json();
        if (profile?.picture) setCreatorPhoto(profile.picture);
      }
    } catch (error) {
      console.error('Error cargando foto de perfil:', error);
    }
  };

  const handleLogout = () => logoutCsrf(history, '/login');

  useEffect(() => {
    loadCreatorPhoto();
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      // Usar endpoint /all para ver todas las listas de todos los creadores (visibles y ocultas)
      const response = await fetch('/api/creator/playlists/all', { credentials: 'include' });
      if (!response.ok) throw new Error('No se pudieron cargar las listas');
      setPlaylists(await response.json());
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaylists = playlists.filter(p => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return p.nombre.toLowerCase().includes(q) || (p.descripcion || '').toLowerCase().includes(q);
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      showWarning('Introduce un nombre');
      return;
    }

    try {
      const response = await fetch('/api/creator/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          nombre: newName,
          descripcion: newDescription,
          visible: visible
        })
      });

      if (response.status === 409) {
        showError('Nombre de lista ya existe');
        return;
      }
      if (!response.ok) {
        const body = await response.text();
        showError(`Error al crear: ${body}`);
        return;
      }

      const created = await response.json();
      setPlaylists(prev => [...prev, created]);
      setShowCreatePanel(false);
      setNewName('');
      setNewDescription('');
      setVisible(true);
      showSuccess('Lista creada correctamente');
    } catch (e) {
      showError(e.message);
    }
  };

  const openDetail = (id) => {
    console.log('Navegando a detalle de lista:', id);
    history.push(`/creator/playlists/${id}`);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-box">
          <p className="help-text">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container" style={{ position: 'relative' }}>
      <div className="dashboard-box">
        <CreatorTopBar
          photoUrl={creatorPhoto}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((v) => !v)}
          onLogout={handleLogout}
          onViewProfile={() => {
            setMenuOpen(false);
            history.push('/creator/profile');
          }}
          onEditProfile={() => {
            setMenuOpen(false);
            history.push('/creator/profile?edit=1');
          }}
        />

        <h2 className="section-title">Panel del creador</h2>

        <CreatorTabs />

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:16 }}>
          <div>
            <span className="help-text" style={{ fontSize: 16 }}>Total: {playlists.length}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input
              className="input"
              placeholder="Buscar por nombre o descripción..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ minWidth:260 }}
            />
            <button className="btn btn-primary" onClick={() => setShowCreatePanel(s => !s)}>
              {showCreatePanel ? 'Cerrar' : 'Nueva lista'}
            </button>
          </div>
        </div>

        {showCreatePanel && (
          <div className="form-card" style={{ marginBottom:24 }}>
            <h3 style={{ marginTop:0 }}>Crear lista</h3>
            <form onSubmit={handleCreate}>
              <div className="form-row">
                <label htmlFor="playlist-name">Nombre <span className="required">*</span></label>
                <input id="playlist-name" className="input" value={newName} onChange={e => setNewName(e.target.value)} maxLength={50} required />
              </div>
              <div className="form-row">
                <label htmlFor="playlist-description">Descripción</label>
                <textarea id="playlist-description" className="textarea" value={newDescription} onChange={e => setNewDescription(e.target.value)} maxLength={200} rows={3} />
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button type="submit" className="btn btn-primary">Crear</button>
                <button type="button" className="btn btn-neutral" onClick={() => setShowCreatePanel(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        <div>
          {filteredPlaylists.length === 0 && (
            <div className="empty-state"><p>No hay listas que coincidan.</p></div>
          )}
          {filteredPlaylists.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Creador</th>
                  <th>Visible</th>
                  <th>Ítems</th>
                  <th className="actions">Acciones</th>
                </tr>
              </thead>
              <tbody>
              {filteredPlaylists.map(p => {
                return (
                    <tr key={p.id}>
                      <td>{p.nombre}</td>
                      <td style={{ maxWidth:320 }}>
                        {(p.descripcion || '-').length > 60 ? (p.descripcion || '-').slice(0,60) + '…' : (p.descripcion || '-')}
                      </td>
                      <td>{p.creatorAlias || 'Desconocido'}</td>
                      <td>{p.visible ? 'Sí' : 'No'}</td>
                      <td>{p.items ? p.items.length : 0}</td>
                      <td className="actions">
                        <button className="btn btn-neutral" onClick={() => openDetail(p.id)}>Ver</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

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

export default CreatorPlaylistsPage;
