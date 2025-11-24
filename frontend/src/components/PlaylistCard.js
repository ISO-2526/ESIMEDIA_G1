import React from 'react';
import './PlaylistCard.css';

function PlaylistCard({ playlist, onClick }) {
  const itemCount = playlist.items ? playlist.items.length : 0;
  const isFavoritos = playlist.nombre === 'Favoritos' && playlist.isPermanent;
  
  // Calcular tiempo estimado basado en número de contenidos (promedio 45 min por contenido)
  const estimatedMinutes = itemCount * 45;
  const hours = Math.floor(estimatedMinutes / 60);
  const minutes = estimatedMinutes % 60;
  const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  
  return (
    <div 
      className={`playlist-card ${isFavoritos ? 'favoritos-permanent' : ''}`} 
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      role="button"
      tabIndex={0}
      aria-label={`Ver lista de reproducción ${playlist.nombre}`}
    >
      <div className="playlist-card-background">
        <div className="playlist-gradient-orb playlist-orb-1"></div>
        <div className="playlist-gradient-orb playlist-orb-2"></div>
        <div className="playlist-gradient-orb playlist-orb-3"></div>
      </div>
      
      <div className="playlist-card-header">
        <div className="playlist-card-icon">
          <i className={isFavoritos ? "fas fa-heart" : "fas fa-list"}></i>
          <div className="playlist-icon-glow"></div>
        </div>
        <span className="playlist-count-badge">{itemCount}</span>
      </div>
      
      <div className="playlist-card-content">
        <h3 className="playlist-card-title">{playlist.nombre}</h3>
        {playlist.descripcion && (
          <p className="playlist-card-description">{playlist.descripcion}</p>
        )}
        
        <div className="playlist-card-stats">
          <div className="playlist-stat">
            <i className="fas fa-film"></i>
            <span>{itemCount} {itemCount === 1 ? 'contenido' : 'contenidos'}</span>
          </div>
          <div className="playlist-stat">
            <i className="fas fa-clock"></i>
            <span>{duration}</span>
          </div>
        </div>
        
        <div className="playlist-card-footer">
          <div className="playlist-date">
            <i className="far fa-calendar"></i>
            <span>{new Date(playlist.createdAt).toLocaleDateString('es-ES', { 
              day: 'numeric', 
              month: 'short', 
              year: 'numeric' 
            })}</span>
          </div>
          <div className="playlist-card-arrow">
            <i className="fas fa-arrow-right"></i>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlaylistCard;
