import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import './VideoPlayer.css';
import StarRating from './StarRating';
import RatingStats from './RatingStats';
import ViewCounter from './ViewCounter';
import ViewCountService from '../services/ViewCountService';

function VideoPlayer({ videoUrl, onClose, title, contentId, isFavorite, onToggleFavorite, onAddToPlaylist }) {
  console.log('🎬 VideoPlayer montado - URL:', videoUrl);
  const [currentRating, setCurrentRating] = useState(0);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [viewRefreshKey, setViewRefreshKey] = useState(0);
  const viewRegisteredRef = useRef(false);

  // Registrar reproducción cuando se monta el componente (solo una vez)
  useEffect(() => {
    if (contentId && !viewRegisteredRef.current) {
      viewRegisteredRef.current = true;
      registerView();
    }
  }, [contentId]);

  const registerView = async () => {
    try {
      await ViewCountService.registerView(contentId);
      console.log(`👁️ Reproducción registrada para video ${contentId}`);
      // Actualizar contador de reproducciones
      setViewRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error al registrar reproducción:', error);
    }
  };

  const handleRatingChange = (newRating) => {
    setCurrentRating(newRating);
    console.log(`⭐ Nueva valoración para contenido ${contentId}: ${newRating} estrellas`);
    // Forzar actualización de las estadísticas
    setStatsRefreshKey(prev => prev + 1);
  };

  // Extraer el ID del video de YouTube
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    // Para URLs como: https://www.youtube.com/watch?v=VIDEO_ID
    const match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];
    
    // Para URLs como: https://youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return shortMatch[1];
    
    return null;
  };

  const videoId = getYouTubeVideoId(videoUrl);
  console.log('🎯 Video ID extraído:', videoId);

  const handleOverlayClick = (e) => {
    // Solo cerrar si se hace click directamente en el overlay
    if (e.target === e.currentTarget) {
      console.log('� Cerrando por click en overlay');
      onClose();
    }
  };

  const handleCloseClick = (e) => {
    e.stopPropagation();
    console.log('❌ Cerrando por botón close');
    onClose();
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite && contentId) {
      onToggleFavorite(contentId);
    }
  };

  if (!videoId) {
    return (
      <div 
        className="video-player-overlay" 
        onClick={handleOverlayClick}
        onKeyDown={(e) => { if (e.key === 'Escape') handleOverlayClick(e); }}
        role="button"
        tabIndex={0}
        aria-label="Cerrar reproductor de video"
      >
        <div className="video-player-container">
          <div className="video-player-header">
            <h2 className="video-player-title">{title}</h2>
            <button className="video-player-close" onClick={handleCloseClick}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="video-player-wrapper">
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              textAlign: 'center',
              padding: '20px',
              zIndex: 10
            }}>
              <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', marginBottom: '20px', color: '#ff6b6b' }}></i>
              <h3 style={{ marginBottom: '10px' }}>URL de video inválida</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>URL: {videoUrl || 'No definida'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Construir URL del iframe con parámetros optimizados
  const iframeUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&modestbranding=1&rel=0&fs=1&enablejsapi=1`;

  console.log('📺 URL del iframe:', iframeUrl);

  return (
    <div 
      className="video-player-overlay" 
      onClick={handleOverlayClick}
      onKeyDown={(e) => { if (e.key === 'Escape') handleOverlayClick(e); }}
      role="button"
      tabIndex={0}
      aria-label="Cerrar reproductor de video"
    >
      <div className="video-player-container">
        <div className="video-player-header">
          <h2 className="video-player-title">{title}</h2>
          <button className="video-player-close" onClick={handleCloseClick}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="video-player-wrapper">
          <iframe
            src={iframeUrl}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
        </div>
        
        {/* Información y Controles estilo YouTube */}
        {contentId && (
          <div className="video-info-section">
            {/* Estadísticas y botones en una línea */}
            <div className="video-primary-info">
              <RatingStats 
                contentId={contentId} 
                showDistribution={false} 
                refreshKey={statsRefreshKey}
              />
              <div className="video-right-section">
                <ViewCounter contentId={contentId} refreshKey={viewRefreshKey} />
                {onToggleFavorite && (
                  <button 
                    className={`action-btn ${isFavorite ? 'active' : ''}`}
                    onClick={handleFavoriteClick}
                  >
                    <i className={isFavorite ? 'fas fa-heart' : 'far fa-heart'}></i>
                    <span>Me gusta</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sección de valoración del usuario */}
            <div className="video-user-rating">
              <div className="rating-header">
                <h3>Valora este contenido</h3>
              </div>
              <StarRating 
                contentId={contentId} 
                contentType="video"
                onChange={handleRatingChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

VideoPlayer.propTypes = {
  videoUrl: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  contentId: PropTypes.number,
  isFavorite: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
  onAddToPlaylist: PropTypes.func
};

export default VideoPlayer;

