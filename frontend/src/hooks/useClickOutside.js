import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para detectar clics fuera de un elemento
 * @param {Function} handler - Función a ejecutar cuando se hace clic fuera
 * @param {boolean} isActive - Si el hook está activo
 * @returns {React.RefObject} - Ref para asignar al elemento
 */
export const useClickOutside = (handler, isActive = true) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    };

    // Solo agregar listener en versión web
    if (typeof window !== 'undefined' && !window.cordova) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      if (typeof window !== 'undefined' && !window.cordova) {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      }
    };
  }, [handler, isActive]);

  return ref;
};