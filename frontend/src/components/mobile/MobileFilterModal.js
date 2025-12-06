import React from 'react';
import {
  IonPopover,
  IonIcon
} from '@ionic/react';
import {
  sparklesOutline,
  starOutline,
  trendingUpOutline,
  timeOutline,
  refreshOutline
} from 'ionicons/icons';
import './MobileFilterModal.css';

const MobileFilterModal = ({ isOpen, onClose, currentFilters, onApplyFilters }) => {
  const handleFilterChange = (sortValue) => {
    const updatedFilters = { ...currentFilters, sortBy: sortValue };
    onApplyFilters(updatedFilters);
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
    onApplyFilters(defaultFilters);
    onClose();
  };

  const sortOptions = [
    { value: 'recent', label: 'Más reciente', icon: sparklesOutline },
    { value: 'rating', label: 'Mejor valorados', icon: starOutline },
    { value: 'popular', label: 'Más populares', icon: trendingUpOutline },
    { value: 'oldest', label: 'Más antiguo', icon: timeOutline }
  ];

  return (
    <IonPopover
      trigger="filter-menu-trigger"
      isOpen={isOpen}
      onDidDismiss={onClose}
      reference="trigger"
      side="bottom"
      alignment="center"
      arrow={false}
      className="mobile-filter-popover"
    >
      <div className="filter-menu-content">
        {sortOptions.map(option => (
          <button
            key={option.value}
            className={`filter-menu-button ${currentFilters.sortBy === option.value ? 'selected' : ''}`}
            onClick={() => handleFilterChange(option.value)}
          >
            <IonIcon icon={option.icon} />
            <span>{option.label}</span>
            {currentFilters.sortBy === option.value && (
              <div className="selected-indicator"></div>
            )}
          </button>
        ))}
        
        <button
          className="filter-menu-button clear-button"
          onClick={handleClear}
        >
          <IonIcon icon={refreshOutline} />
          <span>Restablecer</span>
        </button>
      </div>
    </IonPopover>
  );
};

export default MobileFilterModal;
