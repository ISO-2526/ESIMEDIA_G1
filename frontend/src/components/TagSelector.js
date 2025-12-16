import React from 'react';
import PropTypes from 'prop-types';
import './TagSelector.css';
import { TAGS } from '../creator/components/constants'; // Usar mismos tags que contenido

/**
 * Componente TagSelector para HDU 492.
 * Permite seleccionar múltiples tags de preferencias del usuario.
 * Usa los mismos tags que el contenido para asegurar matching correcto.
 * 
 * Props:
 * - selectedTags: Array de tags actualmente seleccionados
 * - onChange: Función que recibe el nuevo array de tags
 * - maxTags: Máximo de tags permitidos (default: 10)
 */

// Usar los mismos tags que el contenido para que coincidan las notificaciones
const AVAILABLE_TAGS = TAGS;

function TagSelector({ selectedTags = [], onChange, maxTags = 10 }) {

    const handleTagClick = (tag) => {
        const currentTags = selectedTags || [];

        if (currentTags.includes(tag)) {
            // Quitar tag
            onChange(currentTags.filter(t => t !== tag));
        } else if (currentTags.length < maxTags) {
            // Añadir tag si no supera el máximo
            onChange([...currentTags, tag]);
        }
    };

    const isSelected = (tag) => (selectedTags || []).includes(tag);
    const canAddMore = (selectedTags || []).length < maxTags;

    return (
        <div className="tag-selector">
            <div className="tag-selector-header">
                <span className="tag-selector-label">🎯 Mis Gustos</span>
                <span className="tag-selector-count">
                    {(selectedTags || []).length}/{maxTags} seleccionados
                </span>
            </div>

            <p className="tag-selector-hint">
                Selecciona tus preferencias para recibir recomendaciones personalizadas
            </p>

            <div className="tag-cloud">
                {AVAILABLE_TAGS.map(tag => (
                    <button
                        key={tag}
                        type="button"
                        className={`tag-chip ${isSelected(tag) ? 'selected' : ''} ${!canAddMore && !isSelected(tag) ? 'disabled' : ''}`}
                        onClick={() => handleTagClick(tag)}
                        disabled={!canAddMore && !isSelected(tag)}
                        aria-pressed={isSelected(tag)}
                    >
                        {isSelected(tag) && <span className="tag-check">✓</span>}
                        {tag}
                    </button>
                ))}
            </div>

            {(selectedTags || []).length > 0 && (
                <div className="selected-tags-preview">
                    <span className="preview-label">Seleccionados:</span>
                    <div className="selected-tags-list">
                        {(selectedTags || []).map(tag => (
                            <span key={tag} className="selected-tag-badge">
                                {tag}
                                <button
                                    type="button"
                                    className="remove-tag"
                                    onClick={() => handleTagClick(tag)}
                                    aria-label={`Quitar ${tag}`}
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

TagSelector.propTypes = {
    selectedTags: PropTypes.arrayOf(PropTypes.string),
    onChange: PropTypes.func.isRequired,
    maxTags: PropTypes.number
};

export default TagSelector;
