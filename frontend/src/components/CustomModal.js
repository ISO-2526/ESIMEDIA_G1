import React from 'react';
import './CustomModal.css';

/**
 * Componente de Modal personalizado para reemplazar los alert()
 * 
 * @param {boolean} isOpen - Si el modal está abierto
 * @param {function} onClose - Función para cerrar el modal
 * @param {function} onConfirm - Función para confirmar (opcional, solo para modales de confirmación)
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje del modal
 * @param {string} type - Tipo de modal: 'info', 'success', 'error', 'warning', 'confirm'
 * @param {string} confirmText - Texto del botón de confirmación (default: 'Aceptar')
 * @param {string} cancelText - Texto del botón de cancelar (default: 'Cancelar')
 */
function CustomModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar'
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <i className="fas fa-check-circle modal-icon success"></i>;
      case 'error':
        return <i className="fas fa-exclamation-circle modal-icon error"></i>;
      case 'warning':
        return <i className="fas fa-exclamation-triangle modal-icon warning"></i>;
      case 'confirm':
        return <i className="fas fa-question-circle modal-icon confirm"></i>;
      default:
        return <i className="fas fa-info-circle modal-icon info"></i>;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div 
      className="custom-modal-overlay" 
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      role="button"
      tabIndex={0}
      aria-label="Cerrar modal"
    >
      <div 
        className="custom-modal-content" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="custom-modal-header">
          {getIcon()}
          <h3>{title}</h3>
        </div>
        <div className="custom-modal-body">
          <p>{message}</p>
        </div>
        <div className="custom-modal-actions">
          {type === 'confirm' ? (
            <>
              <button className="custom-modal-btn btn-cancel" onClick={onClose}>
                {cancelText}
              </button>
              <button className={`custom-modal-btn btn-confirm btn-confirm-${type}`} onClick={handleConfirm}>
                {confirmText}
              </button>
            </>
          ) : (
            <button className={`custom-modal-btn btn-single btn-${type}`} onClick={onClose}>
              {confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomModal;
