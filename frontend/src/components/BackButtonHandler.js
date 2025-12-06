import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const BackButtonHandler = () => {
  const history = useHistory();

  useEffect(() => {
    // Solo activar en Android
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
      const currentPath = history.location.pathname;
      
      // Rutas principales - salir de la app
      const mainRoutes = ['/', '/dashboard', '/login'];
      
      if (mainRoutes.includes(currentPath) || !canGoBack) {
        // Mostrar confirmación antes de salir
        if (window.confirm('¿Deseas salir de ESIMEDIA?')) {
          App.exitApp();
        }
      } else {
        // En cualquier otra ruta, retroceder
        history.goBack();
      }
    });

    // Cleanup: remover el listener cuando el componente se desmonte
    return () => {
      backButtonListener.remove();
    };
  }, [history]);

  return null; // Este componente no renderiza nada
};

export default BackButtonHandler;
