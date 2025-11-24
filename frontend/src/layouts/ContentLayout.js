import React from 'react';
import PropTypes from 'prop-types';
import './ContentLayout.css';

function ContentLayout({ title, content, onContentClick, onShowInfo, searchQuery, onAddToPlaylist, isUserVip = true }) {
  
  const handleAddToPlaylistClick = (e, item) => {
    e.stopPropagation();
    if (onAddToPlaylist) {
      onAddToPlaylist(item);
    }
  };

  const handleInfoClick = (e, item) => {
    e.stopPropagation();
    if (onShowInfo) {
      onShowInfo(item);
    }
  };

  const handlePlayClick = (e, item) => {
    e.stopPropagation();
    if (onContentClick) {
      onContentClick(item);
    }
  };

  return (
    <section className="content-layout">
      <div className="section-header-layout">
        <h2 className="section-title-layout">{title}</h2>
        {searchQuery && (
          <span className="search-results-info">
            {content.length} {content.length === 1 ? 'resultado' : 'resultados'} para "{searchQuery}"
          </span>
        )}
      </div>

      {content.length === 0 ? (
        <div className="no-results">
          <i className="fas fa-search"></i>
          <p>No se encontraron contenidos</p>
          <span>Intenta con otros términos de búsqueda</span>
        </div>
      ) : (
        <div className="content-grid-layout">
          {content.map((item) => {
            return (
              <div 
                key={item.id} 
                className="content-card-layout"
              >
                <div className="card-image-container">
                  <img src={item.imagen} alt={item.titulo} />
                  {item.vipOnly && !isUserVip && (
                    <div className="vip-badge-layout">
                      <i className="fas fa-crown"></i> VIP
                    </div>
                  )}
                  <div className="card-overlay-layout">
                    <div className="overlay-content">
                      <h3 className="card-title-layout">{item.titulo}</h3>
                      <div className="card-meta-layout">
                        <span className="card-category">{item.categoria}</span>
                        <span className="card-year">{item.year}</span>
                        <span className="card-duration">{item.duration}</span>
                      </div>
                      <div className="card-rating-layout">
                        <i className="fas fa-star"></i>
                        <span>{item.ratingStars}</span>
                      </div>
                      <div className="card-actions">
                        <button 
                          className="card-btn card-btn-play" 
                          title="Reproducir"
                          onClick={(e) => handlePlayClick(e, item)}
                          aria-label={`Reproducir ${item.titulo}`}
                        >
                          <i className="fas fa-play"></i>
                        </button>
                        <button 
                          className="card-btn card-btn-info" 
                          title="Más información"
                          onClick={(e) => handleInfoClick(e, item)}
                          aria-label={`Más información sobre ${item.titulo}`}
                        >
                          <i className="fas fa-info-circle"></i>
                        </button>
                        {onAddToPlaylist && (
                          <button 
                            className="card-btn card-btn-add"
                            onClick={(e) => handleAddToPlaylistClick(e, item)}
                            title="Añadir a lista"
                            aria-label={`Añadir ${item.titulo} a lista`}
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

ContentLayout.propTypes = {
  title: PropTypes.string.isRequired,
  content: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    titulo: PropTypes.string.isRequired,
    imagen: PropTypes.string.isRequired,
    categoria: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    duration: PropTypes.string,
    ratingStars: PropTypes.number
  })).isRequired,
  onContentClick: PropTypes.func,
  onShowInfo: PropTypes.func,
  searchQuery: PropTypes.string,
  onAddToPlaylist: PropTypes.func
};

export default ContentLayout;
