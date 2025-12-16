import React from 'react';
import './ContentCard.css';
import ViewCounter from './ViewCounter';

function ContentCard({ content, onContentClick, onAddToPlaylist, onRemove, showRemove = false, isUserVip = true, isVipContent = false }) {
  
  const handleAddToPlaylistClick = (e) => {
    e.stopPropagation();
    if (onAddToPlaylist) {
      onAddToPlaylist(content);
    }
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(content.id);
    }
  };

  return (
    <div 
      className="content-card" 
      onClick={() => onContentClick?.(content)}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onContentClick) { e.preventDefault(); onContentClick(content); } }}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalles de ${content.titulo}`}
    >
      <div className="content-card-image-container">
        <img src={content.imagen} alt={content.titulo} />
        {content.type === 'AUDIO' && (
          <div className="content-type-badge">
            <i className="fas fa-headphones-alt"></i> Audio
          </div>
        )}
        {isVipContent && !isUserVip && (
          <div className="vip-content-badge">
            <i className="fas fa-crown"></i> VIP
          </div>
        )}
        <div className="content-card-overlay">
          <div className="overlay-content">
            <h3 className="content-card-title">{content.titulo}</h3>
            <div className="content-card-meta">
              <span className="content-card-category">{content.categoria}</span>
              <span className="content-card-year">{content.year}</span>
              <span className="content-card-duration">{content.duration}</span>
            </div>
            <div className="content-card-info-row">
              <div className="content-card-rating">
                <i className="fas fa-star"></i>
                <span>{content.ratingStars}</span>
              </div>
              {content.id && <ViewCounter contentId={content.id} />}
            </div>
            <div className="content-card-actions">
              <button className="content-card-btn content-card-btn-play" title="Reproducir">
                <i className={content.type === 'AUDIO' ? 'fas fa-headphones-alt' : 'fas fa-play'}></i>
              </button>
              <button className="content-card-btn content-card-btn-info" title="Más información">
                <i className="fas fa-info-circle"></i>
              </button>
              {onAddToPlaylist && (
                <button 
                  className="content-card-btn content-card-btn-add" 
                  onClick={handleAddToPlaylistClick}
                  title="Añadir a lista"
                >
                  <i className="fas fa-plus"></i>
                </button>
              )}
              {showRemove && onRemove && (
                <button 
                  className="content-card-btn content-card-btn-remove" 
                  onClick={handleRemoveClick}
                  title="Eliminar de la lista"
                >
                  <i className="fas fa-trash"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContentCard;
