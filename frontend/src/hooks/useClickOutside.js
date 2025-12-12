import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para detectar clics fuera de un elemento
 * @param {Function} handler - Función a ejecutar cuando se hace clic fuera
 * @param {boolean} isActive - Si el hook está activo
 * @param {React.RefObject[]} excludeRefs - Referencias adicionales a excluir del cierre
 * @returns {React.RefObject} - Ref para asignar al elemento
 */
export const useClickOutside = (handler, isActive = true, excludeRefs = []) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (event) => {
      // Verificar si el clic es dentro del elemento principal
      if (ref.current && ref.current.contains(event.target)) {
        return;
      }

      // Verificar si el clic es dentro de algún elemento excluido
      const isExcluded = excludeRefs.some(excludeRef => 
        excludeRef.current && excludeRef.current.contains(event.target)
      );

      if (isExcluded) {
        return;
      }

      // Si no es dentro del elemento ni de los excluidos, ejecutar handler
      handler();
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
  }, [handler, isActive, excludeRefs]);

  return ref;
};