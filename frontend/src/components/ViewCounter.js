import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import ViewCountService from '../services/ViewCountService';
import './ViewCounter.css';

/**
 * Componente que muestra el contador de reproducciones de un contenido.
 */
function ViewCounter({ contentId, refreshKey = 0 }) {
  const [viewCount, setViewCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contentId) {
      loadViewCount();
    }
  }, [contentId, refreshKey]);

  const loadViewCount = async () => {
    try {
      setLoading(true);
      const count = await ViewCountService.getViewCount(contentId);
      setViewCount(count);
    } catch (error) {
      console.error('Error al cargar reproducciones:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="view-counter-loading">
        <i className="fas fa-spinner fa-spin"></i>
      </div>
    );
  }

  return (
    <div className="view-counter">
      <i className="fas fa-eye"></i>
      <span className="view-count-text">
        {viewCount.toLocaleString()} {viewCount === 1 ? 'reproducción' : 'reproducciones'}
      </span>
    </div>
  );
}

ViewCounter.propTypes = {
  contentId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  refreshKey: PropTypes.number
};

export default ViewCounter;
