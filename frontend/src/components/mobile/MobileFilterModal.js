import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonChip,
  IonIcon,
  IonLabel,
  IonRange,
  IonItem
} from '@ionic/react';
import {
  closeOutline,
  checkmarkCircle,
  sparklesOutline,
  starOutline,
  trendingUpOutline,
  refreshOutline,
  filterOutline
} from 'ionicons/icons';
import './MobileFilterModal.css';

const MobileFilterModal = ({ isOpen, onClose, currentFilters, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState({
    sortBy: 'recent',
    categories: [],
    yearRange: { min: 2000, max: new Date().getFullYear() },
    durationRange: { min: 0, max: 180 },
    minRating: 0
  });

  // Sincronizar con filtros externos cuando se abre el modal
  useEffect(() => {
    if (isOpen && currentFilters) {
      setLocalFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleSortChange = (sortValue) => {
    setLocalFilters({ ...localFilters, sortBy: sortValue });
  };

  const handleCategoryToggle = (category) => {
    const currentCategories = localFilters.categories || [];
    const isSelected = currentCategories.includes(category);
    
    setLocalFilters({
      ...localFilters,
      categories: isSelected
        ? currentCategories.filter(c => c !== category)
        : [...currentCategories, category]
    });
  };

  const handleYearRangeChange = (event) => {
    const { lower, upper } = event.detail.value;
    setLocalFilters({
      ...localFilters,
      yearRange: { min: lower, max: upper }
    });
  };

  const handleDurationRangeChange = (event) => {
    const { lower, upper } = event.detail.value;
    setLocalFilters({
      ...localFilters,
      durationRange: { min: lower, max: upper }
    });
  };

  const handleRatingChange = (event) => {
    setLocalFilters({
      ...localFilters,
      minRating: event.detail.value
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const defaultFilters = {
      sortBy: 'recent',
      categories: [],
      yearRange: { min: 2000, max: new Date().getFullYear() },
      durationRange: { min: 0, max: 180 },
      minRating: 0
    };
    setLocalFilters(defaultFilters);
  };

  const availableCategories = [
    'Acción', 'Aventura', 'Comedia', 'Drama', 'Terror',
    'Ciencia Ficción', 'Romance', 'Thriller', 'Documental', 'Animación'
  ];

  const sortOptions = [
    { value: 'recent', label: 'Más reciente', icon: sparklesOutline },
    { value: 'rating', label: 'Mejor valorados', icon: starOutline },
    { value: 'popular', label: 'Más populares', icon: trendingUpOutline }
  ];

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onClose}
      initialBreakpoint={0.75}
      breakpoints={[0, 0.5, 0.75, 1]}
      className="mobile-filter-modal"
    >
      <IonHeader className="modal-header">
        <IonToolbar className="modal-toolbar">
          <IonTitle className="modal-title">
            <IonIcon icon={filterOutline} className="modal-title-icon" />
            Filtros Avanzados
          </IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            onClick={onClose}
            className="modal-close-btn"
          >
            <IonIcon icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="modal-content">
        {/* Sección: Ordenar por */}
        <div className="filter-section">
          <h3 className="filter-section-title">
            <IonIcon icon={sparklesOutline} />
            Ordenar por
          </h3>
          <div className="filter-chips-container">
            {sortOptions.map(option => (
              <IonChip
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`filter-chip ${localFilters.sortBy === option.value ? 'selected' : ''}`}
              >
                <IonIcon icon={option.icon} />
                <IonLabel>{option.label}</IonLabel>
                {localFilters.sortBy === option.value && (
                  <IonIcon icon={checkmarkCircle} className="check-icon" />
                )}
              </IonChip>
            ))}
          </div>
        </div>

        {/* Sección: Categorías */}
        <div className="filter-section">
          <h3 className="filter-section-title">
            <IonIcon icon={starOutline} />
            Categorías
          </h3>
          <div className="filter-chips-container">
            {availableCategories.map(category => (
              <IonChip
                key={category}
                onClick={() => handleCategoryToggle(category)}
                className={`filter-chip ${
                  localFilters.categories?.includes(category) ? 'selected' : ''
                }`}
              >
                <IonLabel>{category}</IonLabel>
                {localFilters.categories?.includes(category) && (
                  <IonIcon icon={checkmarkCircle} className="check-icon" />
                )}
              </IonChip>
            ))}
          </div>
        </div>

        {/* Sección: Rango de Años */}
        <div className="filter-section">
          <h3 className="filter-section-title">
            Año de lanzamiento
          </h3>
          <IonItem lines="none" className="range-item">
            <IonRange
              dualKnobs={true}
              min={1980}
              max={new Date().getFullYear()}
              step={1}
              value={{
                lower: localFilters.yearRange.min,
                upper: localFilters.yearRange.max
              }}
              onIonChange={handleYearRangeChange}
              pin={true}
              className="year-range"
            >
              <div slot="start" className="range-label">{localFilters.yearRange.min}</div>
              <div slot="end" className="range-label">{localFilters.yearRange.max}</div>
            </IonRange>
          </IonItem>
        </div>

        {/* Sección: Duración */}
        <div className="filter-section">
          <h3 className="filter-section-title">
            Duración (minutos)
          </h3>
          <IonItem lines="none" className="range-item">
            <IonRange
              dualKnobs={true}
              min={0}
              max={180}
              step={5}
              value={{
                lower: localFilters.durationRange.min,
                upper: localFilters.durationRange.max
              }}
              onIonChange={handleDurationRangeChange}
              pin={true}
              className="duration-range"
            >
              <div slot="start" className="range-label">{localFilters.durationRange.min}</div>
              <div slot="end" className="range-label">{localFilters.durationRange.max}</div>
            </IonRange>
          </IonItem>
        </div>

        {/* Sección: Valoración Mínima */}
        <div className="filter-section">
          <h3 className="filter-section-title">
            <IonIcon icon={starOutline} />
            Valoración mínima: {localFilters.minRating.toFixed(1)} ⭐
          </h3>
          <IonItem lines="none" className="range-item">
            <IonRange
              min={0}
              max={5}
              step={0.5}
              value={localFilters.minRating}
              onIonChange={handleRatingChange}
              pin={true}
              className="rating-range"
            />
          </IonItem>
        </div>

        {/* Botones de acción */}
        <div className="filter-actions">
          <IonButton
            expand="block"
            onClick={handleClear}
            fill="outline"
            className="clear-button"
          >
            <IonIcon icon={refreshOutline} slot="start" />
            Limpiar Filtros
          </IonButton>
          <IonButton
            expand="block"
            onClick={handleApply}
            className="apply-button"
          >
            <IonIcon icon={checkmarkCircle} slot="start" />
            Aplicar Filtros
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default MobileFilterModal;
