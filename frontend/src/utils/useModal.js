import { useState } from 'react';

/**
 * Hook personalizado para manejar modales de forma sencilla
 * Reemplaza el uso de alert() con un sistema de modales elegante
 */
export const useModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    confirmText: 'Aceptar',
    cancelText: 'Cancelar'
  });

  const showModal = (config) => {
    setModalState({
      isOpen: true,
      title: config.title || 'Información',
      message: config.message || '',
      type: config.type || 'info',
      onConfirm: config.onConfirm || null,
      confirmText: config.confirmText || 'Aceptar',
      cancelText: config.cancelText || 'Cancelar'
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({
      ...prev,
      isOpen: false
    }));
  };

  // Métodos convenientes para diferentes tipos de modales
  const showSuccess = (message, title = '¡Éxito!') => {
    showModal({ type: 'success', title, message });
  };

  const showError = (message, title = 'Error') => {
    showModal({ type: 'error', title, message });
  };

  const showWarning = (message, title = 'Advertencia') => {
    showModal({ type: 'warning', title, message });
  };

  const showInfo = (message, title = 'Información') => {
    showModal({ type: 'info', title, message });
  };

  const showConfirm = (message, onConfirm, title = 'Confirmar', confirmText = 'Confirmar', cancelText = 'Cancelar') => {
    showModal({ 
      type: 'confirm', 
      title, 
      message, 
      onConfirm,
      confirmText,
      cancelText
    });
  };

  return {
    modalState,
    showModal,
    closeModal,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm
  };
};
