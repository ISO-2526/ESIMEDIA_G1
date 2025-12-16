import React from 'react';
import PropTypes from 'prop-types';
import './VipUpgradeModal.css';

function VipUpgradeModal({ isOpen, onClose, onConfirm, contentTitle }) {
  if (!isOpen) return null;

  return (
    <div 
      className="vip-modal-overlay" 
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      role="button"
      tabIndex={0}
      aria-label="Cerrar modal"
    >
      <div 
        className="vip-modal-content" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="vip-modal-header">
          <h2>¿Hacerte VIP?</h2>
        </div>
        <div className="vip-modal-body">
          <p>
            Estás seguro de que deseas actualizar tu cuenta a VIP? Tendrás acceso a <strong>contenido exclusivo</strong>.
          </p>
        </div>
        <div className="vip-modal-actions">
          <button className="vip-modal-btn vip-modal-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="vip-modal-btn vip-modal-btn-confirm" onClick={onConfirm}>
            Confirmar upgrade
          </button>
        </div>
      </div>
    </div>
  );
}

VipUpgradeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  contentTitle: PropTypes.string
};

export default VipUpgradeModal;
