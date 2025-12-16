import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import RatingService from '../services/RatingService';
import './RatingStats.css';

/**
 * Componente que muestra estadísticas agregadas de valoraciones de un contenido.
 * Ejemplo: "4.2 ⭐ (127 valoraciones)"
 */
function RatingStats({ contentId, showDistribution = false, refreshKey = 0 }) {
  // Convertir contentId a string si es número
  const contentIdStr = contentId ? String(contentId) : null;
  const [stats, setStats] = useState({
    averageRating: 0.0,
    totalRatings: 0,
    distribution: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contentIdStr) {
      loadStats();
    }
  }, [contentIdStr, refreshKey]); // Recargar cuando cambie refreshKey

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await RatingService.getContentStats(contentIdStr);
      setStats(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rating-stats-loading">
        <i className="fas fa-spinner fa-spin"></i>
      </div>
    );
  }

  const { averageRating, totalRatings, distribution } = stats;

  // Generar estrellas visuales para el promedio
  const renderAverageStars = () => {
    const stars = [];
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.25 && averageRating % 1 < 0.75;
    const hasFullStar = averageRating % 1 >= 0.75;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<i key={i} className="fas fa-star star-gold"></i>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<i key={i} className="fas fa-star-half-alt star-gold"></i>);
      } else if (i === fullStars && hasFullStar) {
        stars.push(<i key={i} className="fas fa-star star-gold"></i>);
      } else {
        stars.push(<i key={i} className="far fa-star star-empty"></i>);
      }
    }
    return stars;
  };

  // Renderizar distribución de estrellas
  const renderDistribution = () => {
    if (!showDistribution || !distribution || Object.keys(distribution).length === 0) {
      return null;
    }

    return (
      <div className="rating-distribution">
        <h4 className="distribution-title">Distribución de valoraciones</h4>
        {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1.5, 1, 0.5].map(rating => {
          const count = distribution[rating] || 0;
          const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

          return (
            <div key={rating} className="distribution-row">
              <span className="distribution-label">{rating} ⭐</span>
              <div className="distribution-bar-container">
                <div 
                  className="distribution-bar" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="distribution-count">{count}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="rating-stats-container">
      <div className="rating-stats-summary">
        <div className="average-rating">
          <span className="average-number">{averageRating.toFixed(1)}</span>
          <div className="average-stars">
            {renderAverageStars()}
          </div>
        </div>
        <div className="total-ratings">
          <i className="fas fa-users"></i>
          <span>{totalRatings} {totalRatings === 1 ? 'valoración' : 'valoraciones'}</span>
        </div>
      </div>
      {renderDistribution()}
    </div>
  );
}

RatingStats.propTypes = {
  contentId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  showDistribution: PropTypes.bool,
  refreshKey: PropTypes.number
};

export default RatingStats;
