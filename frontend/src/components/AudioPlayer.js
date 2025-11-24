import React, { useState, useEffect, useRef } from 'react';
import AudioPlayerLib from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import PropTypes from 'prop-types';
import './AudioPlayer.css';
import StarRating from './StarRating';
import RatingStats from './RatingStats';
import ViewCounter from './ViewCounter';
import ViewCountService from '../services/ViewCountService';

function AudioPlayer({ audioFileName, onClose, title, contentId, isFavorite, onToggleFavorite, onAddToPlaylist }) {
  console.log('🎵 AudioPlayer montado - Archivo:', audioFileName);
  
  // Estado para controlar el volumen con mayor precisión
  const [volume, setVolume] = useState(0.7); // Volumen inicial al 70%
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
      console.log(`👁️ Reproducción registrada para audio ${contentId}`);
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

  const handleOverlayClick = (e) => {
    // Solo cerrar si se hace click directamente en el overlay
    if (e.target === e.currentTarget) {
      console.log('👆 Cerrando por click en overlay');
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

  if (!audioFileName) {
    return (
      <div 
        className="audio-player-overlay" 
        onClick={handleOverlayClick}
        onKeyDown={(e) => { if (e.key === 'Escape') handleOverlayClick(e); }}
        role="button"
        tabIndex={0}
        aria-label="Cerrar reproductor de audio"
      >
        <div className="audio-player-container">
          <div className="audio-player-header">
            <h2 className="audio-player-title">{title}</h2>
            <button className="audio-player-close" onClick={handleCloseClick}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="audio-player-wrapper">
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
              <h3 style={{ marginBottom: '10px' }}>Archivo de audio no disponible</h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>No se encontró el archivo de audio</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const audioUrl = `/audio/${audioFileName}`;
  console.log('🔊 URL del audio:', audioUrl);

  return (
    <div 
      className="audio-player-overlay" 
      onClick={handleOverlayClick}
      onKeyDown={(e) => { if (e.key === 'Escape') handleOverlayClick(e); }}
      role="button"
      tabIndex={0}
      aria-label="Cerrar reproductor de audio"
    >
      <div className="audio-player-container">
        <div className="audio-player-header">
          <h2 className="audio-player-title">{title}</h2>
          <button className="audio-player-close" onClick={handleCloseClick}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="audio-player-wrapper">
          <div className="audio-player-visual">
            <div className="audio-equalizer">
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </div>
            <i className="fas fa-music audio-icon"></i>
          </div>
          <div className="audio-player-controls">
            <AudioPlayerLib
              src={audioUrl}
              autoPlay={true}
              showJumpControls={true}
              layout="horizontal"
              customAdditionalControls={[]}
              volume={volume}
              onVolumeChange={(e) => {
                const newVolume = e.target.volume;
                setVolume(newVolume);
                console.log('Volumen cambiado a:', (newVolume * 100).toFixed(0) + '%');
              }}
              onError={(e) => console.error('Error al reproducir audio:', e)}
            />
          </div>
        </div>
        
        {/* Información y Controles estilo streaming */}
        {contentId && (
          <div className="audio-info-section">
            {/* Estadísticas y botones en una línea */}
            <div className="audio-primary-info">
              <RatingStats 
                contentId={contentId} 
                showDistribution={false} 
                refreshKey={statsRefreshKey}
              />
              <div className="audio-right-section">
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
            <div className="audio-user-rating">
              <div className="rating-header">
                <h3>Valora este contenido</h3>
              </div>
              <StarRating 
                contentId={contentId} 
                contentType="audio"
                onChange={handleRatingChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

AudioPlayer.propTypes = {
  audioFileName: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  contentId: PropTypes.string,
  isFavorite: PropTypes.bool,
  onToggleFavorite: PropTypes.func,
  onAddToPlaylist: PropTypes.func,
};

export default AudioPlayer;
