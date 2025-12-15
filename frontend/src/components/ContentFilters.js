import React, { useState, useRef, useEffect } from 'react';
import './ContentFilters.css';

const TAGS = [
  'Música',
  'Podcast',
  'Documental',
  'Educación',
  'Tecnología',
  'Deportes',
  'Noticias',
  'Comedia',
  'Infantil',
  'Gaming',
];

function ContentFilters({ onFiltersChange, activeFiltersCount = 0 }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filters, setFilters] = useState({
    yearRange: { min: 2000, max: new Date().getFullYear() },
    categories: [],
    sortBy: 'recent', // 'recent', 'rating', 'views', 'duration-asc', 'duration-desc'
    durationRange: { min: 0, max: 180 }, // en minutos
    minRating: 0, // 0-5 estrellas
  });

  const dropdownRef = useRef(null);
  const currentYear = new Date().getFullYear();

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleClearFilters = () => {
    const clearedFilters = {
      yearRange: { min: 2000, max: currentYear },
      categories: [],
      sortBy: 'recent',
      durationRange: { min: 0, max: 180 },
      minRating: 0,
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const toggleCategory = (category) => {
    setFilters(prev => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      const newFilters = { ...prev, categories: newCategories };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const handleYearChange = (field, value) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        yearRange: {
          ...prev.yearRange,
          [field]: parseInt(value)
        }
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const handleSortChange = (sortValue) => {
    setFilters(prev => {
      const newFilters = { ...prev, sortBy: sortValue };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const handleDurationChange = (field, value) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        durationRange: {
          ...prev.durationRange,
          [field]: parseInt(value)
        }
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const handleRatingChange = (value) => {
    setFilters(prev => {
      const newFilters = { ...prev, minRating: parseFloat(value) };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const countActiveFilters = () => {
    let count = 0;
    if (filters.categories.length > 0) count += filters.categories.length;
    if (filters.yearRange.min > 2000 || filters.yearRange.max < currentYear) count += 1;
    if (filters.sortBy !== 'recent') count += 1;
    if (filters.durationRange.min > 0 || filters.durationRange.max < 180) count += 1;
    if (filters.minRating > 0) count += 1;
    return count;
  };

  const activeCount = countActiveFilters();

  return (
    <div className="filters-container" ref={dropdownRef}>
      <button 
        className={`filter-button ${activeCount > 0 ? 'active' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <i className="fas fa-filter"></i>
        <span className="filter-text">Filtros</span>
        {activeCount > 0 && (
          <span className="active-filters-badge">{activeCount}</span>
        )}
        <i className={`fas fa-chevron-${showDropdown ? 'up' : 'down'}`} style={{ marginLeft: '5px', fontSize: '12px' }}></i>
      </button>

      {showDropdown && (
        <div className="filters-dropdown">
          <div className="filters-dropdown-header">
            <span><i className="fas fa-sliders-h"></i> Filtros</span>
            <button className="clear-all-btn" onClick={handleClearFilters}>
              <i className="fas fa-eraser"></i> Limpiar
            </button>
          </div>

          <div className="filters-dropdown-body">
            {/* Filtro por Año */}
            <div className="filter-section-dropdown">
              <h4 className="filter-title-dropdown">
                <i className="fas fa-calendar-alt"></i> Año
              </h4>
              <div className="filter-year-range">
                <div className="year-inputs">
                  <input
                    type="number"
                    min="2000"
                    max={currentYear}
                    value={filters.yearRange.min}
                    onChange={(e) => handleYearChange('min', e.target.value)}
                    className="year-input"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="2000"
                    max={currentYear}
                    value={filters.yearRange.max}
                    onChange={(e) => handleYearChange('max', e.target.value)}
                    className="year-input"
                  />
                </div>
              </div>
            </div>

            {/* Filtro por Categoría */}
            <div className="filter-section-dropdown">
              <h4 className="filter-title-dropdown">
                <i className="fas fa-tags"></i> Categorías
              </h4>
              <div className="filter-chips">
                {TAGS.map(tag => (
                  <button
                    key={tag}
                    className={`filter-chip ${filters.categories.includes(tag) ? 'active' : ''}`}
                    onClick={() => toggleCategory(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por Ordenación */}
            <div className="filter-section-dropdown">
              <h4 className="filter-title-dropdown">
                <i className="fas fa-sort"></i> Ordenar por
              </h4>
              <div className="filter-sort-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="sortBy"
                    value="recent"
                    checked={filters.sortBy === 'recent'}
                    onChange={(e) => handleSortChange(e.target.value)}
                  />
                  <span>Más reciente</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="sortBy"
                    value="rating"
                    checked={filters.sortBy === 'rating'}
                    onChange={(e) => handleSortChange(e.target.value)}
                  />
                  <span>Mejor valorados</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="sortBy"
                    value="views"
                    checked={filters.sortBy === 'views'}
                    onChange={(e) => handleSortChange(e.target.value)}
                  />
                  <span>Más visto</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="sortBy"
                    value="duration-asc"
                    checked={filters.sortBy === 'duration-asc'}
                    onChange={(e) => handleSortChange(e.target.value)}
                  />
                  <span>Duración (menor a mayor)</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="sortBy"
                    value="duration-desc"
                    checked={filters.sortBy === 'duration-desc'}
                    onChange={(e) => handleSortChange(e.target.value)}
                  />
                  <span>Duración (mayor a menor)</span>
                </label>
              </div>
            </div>

            {/* Filtro por Duración */}
            <div className="filter-section-dropdown">
              <h4 className="filter-title-dropdown">
                <i className="fas fa-clock"></i> Duración (minutos)
              </h4>
              <div className="filter-year-range">
                <div className="year-inputs">
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={filters.durationRange.min}
                    onChange={(e) => handleDurationChange('min', e.target.value)}
                    className="year-input"
                    placeholder="Min"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={filters.durationRange.max}
                    onChange={(e) => handleDurationChange('max', e.target.value)}
                    className="year-input"
                    placeholder="Max"
                  />
                </div>
                {filters.durationRange.max === 180 && (
                  <small style={{ color: 'rgba(250, 237, 92, 0.7)', fontSize: '11px', marginTop: '4px' }}>
                    <i className="fas fa-info-circle"></i> 180 min = sin límite superior
                  </small>
                )}
              </div>
            </div>

            {/* Filtro por Valoración Mínima */}
            <div className="filter-section-dropdown">
              <h4 className="filter-title-dropdown">
                <i className="fas fa-star"></i> Valoración mínima
              </h4>
              <div className="filter-rating">
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.5"
                  value={filters.minRating}
                  onChange={(e) => handleRatingChange(e.target.value)}
                  className="rating-slider"
                />
                <div className="rating-display">
                  {filters.minRating > 0 ? (
                    <>
                      <span className="rating-value">{filters.minRating.toFixed(1)}</span>
                      <i className="fas fa-star" style={{ color: '#ffc107' }}></i>
                      <span> o más</span>
                    </>
                  ) : (
                    <span className="rating-value">Todas las valoraciones</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ContentFilters;
