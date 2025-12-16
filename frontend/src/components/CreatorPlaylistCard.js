import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './CreatorPlaylistCard.css';
import axios from '../api/axiosConfig';

// Helpers para reducir anidación
const DEFAULT_COVER = '/cover/default.png';

const buildContentIndex = (contents) => {
  const index = new Map();
  contents.forEach((c) => index.set(c.id, c));
  return index;
};

const coverForItem = (item, contentIndex) => {
  const content = contentIndex.get(item.contentId);
  return content?.coverFileName
    ? `/cover/${content.coverFileName}`
    : DEFAULT_COVER;
};

const coversForPlaylist = (items, contentIndex, limit = 4) =>
  items.slice(0, limit).map((item) => coverForItem(item, contentIndex));

function CreatorPlaylistCard({ playlist, onClick }) {
  const [contentCovers, setContentCovers] = useState([]);
  const itemCount = playlist.items ? playlist.items.length : 0;

  useEffect(() => {
    if (!playlist.items || playlist.items.length === 0) {
      setContentCovers([]);
      return;
    }

    let cancelled = false;

    const fetchCovers = async () => {
      try {
        const response = await axios.get('/api/public/contents');
        const allContents = response.data;
        const index = buildContentIndex(allContents);
        const covers = coversForPlaylist(playlist.items, index);

        if (!cancelled) setContentCovers(covers);
      } catch (error) {
        console.error('Error fetching content covers:', error);
      }
    };

    fetchCovers();
    return () => {
      cancelled = true;
    };
  }, [playlist.items]);

  return (
    <div 
      className="creator-playlist-card" 
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Ver lista de reproducción ${playlist.nombre}`}
    >
      <div className="creator-playlist-cover-stack">
        {contentCovers.length > 0 ? (
          <>
            {contentCovers.map((cover, index) => (
              <div 
                key={index} 
                className={`stacked-cover cover-${index + 1}`}
                style={{ backgroundImage: `url(${cover})` }}
              >
                {index === 0 && (
                  <div className="playlist-overlay">
                    <div className="playlist-icon">
                      <i className="fas fa-list"></i>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="empty-cover">
            <i className="fas fa-music"></i>
            <p>Sin contenido</p>
          </div>
        )}
      </div>

      <div className="creator-playlist-info">
        <h3 className="creator-playlist-title">{playlist.nombre}</h3>
        <p className="creator-playlist-creator">
          <i className="fas fa-user-circle"></i> {playlist.creatorAlias || 'Creador'}
        </p>
        {playlist.descripcion && (
          <p className="creator-playlist-description">
            {playlist.descripcion.length > 60 
              ? `${playlist.descripcion.substring(0, 60)}...` 
              : playlist.descripcion}
          </p>
        )}
        <div className="creator-playlist-meta">
          <span>
            <i className="fas fa-film"></i> {itemCount} {itemCount === 1 ? 'contenido' : 'contenidos'}
          </span>
        </div>
      </div>

      <div className="creator-playlist-hover-effect">
        <button className="play-button">
          <i className="fas fa-play"></i>
          <span>Ver Lista</span>
        </button>
      </div>
    </div>
  );
}

CreatorPlaylistCard.propTypes = {
  playlist: PropTypes.shape({
    nombre: PropTypes.string.isRequired,
    descripcion: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.object),
    creatorAlias: PropTypes.string
  }).isRequired,
  onClick: PropTypes.func.isRequired
};

export default CreatorPlaylistCard;
