import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';

function CreatorTabs() {
  const history = useHistory();
  const location = useLocation();

  const isContents = location.pathname === '/creator' || location.pathname === '/creator/';
  const isPlaylists = location.pathname.startsWith('/creator/playlists');
  const isStatistics = location.pathname.startsWith('/creator/statistics');

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16, borderBottom: '2px solid var(--creator-border)' }}>
      <button
        className={isContents ? 'btn btn-primary' : 'btn btn-neutral'}
        onClick={() => history.push('/creator')}
        style={{ borderRadius: '4px 4px 0 0' }}
      >
        Contenidos
      </button>
      <button
        className={isPlaylists ? 'btn btn-primary' : 'btn btn-neutral'}
        onClick={() => history.push('/creator/playlists')}
        style={{ borderRadius: '4px 4px 0 0' }}
      >
        Listas
      </button>
      <button
        className={isStatistics ? 'btn btn-primary' : 'btn btn-neutral'}
        onClick={() => history.push('/creator/statistics')}
        style={{ borderRadius: '4px 4px 0 0' }}
      >
        Estadísticas
      </button>
    </div>
  );
}

export default CreatorTabs;
