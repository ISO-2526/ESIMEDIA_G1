import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function CreatorTabs() {
  const navigate = useNavigate();
  const location = useLocation();

  const isContents = location.pathname === '/creator' || location.pathname === '/creator/';
  const isPlaylists = location.pathname.startsWith('/creator/playlists');
  const isStatistics = location.pathname.startsWith('/creator/statistics');

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, borderBottom: '2px solid var(--creator-border)' }}>
      <button
        className={isContents ? 'btn btn-primary' : 'btn btn-neutral'}
        onClick={() => navigate('/creator')}
        style={{ borderRadius: '4px 4px 0 0' }}
      >
        Contenidos
      </button>
      <button
        className={isPlaylists ? 'btn btn-primary' : 'btn btn-neutral'}
        onClick={() => navigate('/creator/playlists')}
        style={{ borderRadius: '4px 4px 0 0' }}
      >
        Listas
      </button>
      <button
        className={isStatistics ? 'btn btn-primary' : 'btn btn-neutral'}
        onClick={() => navigate('/creator/statistics')}
        style={{ borderRadius: '4px 4px 0 0' }}
      >
        Estadísticas
      </button>
    </div>
  );
}

export default CreatorTabs;
