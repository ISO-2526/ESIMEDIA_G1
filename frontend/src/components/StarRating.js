import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './StarRating.css';
import RatingService from '../services/RatingService';

function StarRating({ contentId, contentType = 'video', initialRating = 0, onChange }) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  // Cargar valoración guardada (intenta desde backend, fallback a localStorage)
  useEffect(() => {
    if (contentId) {
      loadUserRating();
    }
  }, [contentId, contentType]);

  const loadUserRating = async () => {
    try {
      const userRating = await RatingService.getUserRating(contentId, contentType);
      if (userRating && userRating.rating) {
        setRating(userRating.rating);
        if (onChange) {
          onChange(userRating.rating);
        }
      }
    } catch (error) {
      console.error('Error al cargar valoración:', error);
    }
  };

  // Guardar valoración (backend + localStorage)
  const saveRating = async (newRating) => {
    if (contentId) {
      try {
        await RatingService.saveRating(contentId, newRating, contentType);
        setRating(newRating);
        if (onChange) {
          onChange(newRating);
        }
        console.log(`⭐ Valoración guardada: ${newRating} estrellas para ${contentType} ${contentId}`);
      } catch (error) {
        console.error('Error al guardar valoración:', error);
      }
    }
  };

  // Manejar el click en las estrellas
  const handleStarClick = (index, event) => {
    const starElement = event.currentTarget;
    const rect = starElement.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const starWidth = rect.width;
    const clickPercentage = clickX / starWidth;

    // Determinar si es media estrella o completa
    let newRating;
    if (clickPercentage < 0.5) {
      newRating = index + 0.5;
    } else {
      newRating = index + 1;
    }

    saveRating(newRating);
  };

  // Manejar el hover sobre las estrellas
  const handleStarHover = (index, event) => {
    const starElement = event.currentTarget;
    const rect = starElement.getBoundingClientRect();
    const hoverX = event.clientX - rect.left;
    const starWidth = rect.width;
    const hoverPercentage = hoverX / starWidth;

    // Determinar si mostrar media estrella o completa en hover
    let newHoverRating;
    if (hoverPercentage < 0.5) {
      newHoverRating = index + 0.5;
    } else {
      newHoverRating = index + 1;
    }

    setHoverRating(newHoverRating);
  };

  // Limpiar hover
  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  // Determinar qué rating mostrar (hover o actual)
  const displayRating = hoverRating || rating;

  // Renderizar las 5 estrellas
  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      const starValue = i + 1;
      const halfStarValue = i + 0.5;
      
      let starClass = 'star-empty';
      let iconClass = 'far fa-star'; // Estrella vacía por defecto
      
      if (displayRating >= starValue) {
        starClass = 'star-full';
        iconClass = 'fas fa-star'; // Estrella llena
      } else if (displayRating >= halfStarValue) {
        starClass = 'star-half';
        iconClass = 'fas fa-star-half-alt'; // Media estrella
      }

      stars.push(
        <div
          key={i}
          className={`star ${starClass}`}
          onClick={(e) => handleStarClick(i, e)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStarClick(i, e); } }}
          onMouseMove={(e) => handleStarHover(i, e)}
          onMouseLeave={handleMouseLeave}
          role="button"
          tabIndex={0}
          aria-label={`Calificar con ${starValue} ${starValue === 1 ? 'estrella' : 'estrellas'}`}
        >
          <i className={iconClass}></i>
        </div>
      );
    }
    return stars;
  };

  return (
    <div className="star-rating-container">
      <div className="star-rating">
        {renderStars()}
      </div>
      <div className="rating-value">
        {rating > 0 ? `${rating.toFixed(1)} / 5.0` : 'Sin valorar'}
      </div>
    </div>
  );
}

StarRating.propTypes = {
  contentId: PropTypes.number.isRequired,
  contentType: PropTypes.string,
  initialRating: PropTypes.number,
  onChange: PropTypes.func
};

export default StarRating;
