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
      
      // Rutas de autenticación 2FA/3FA - BLOQUEAR retroceso (redirigir al login)
      const blockedRoutes = ['/validate-2fa', '/validate-3fa'];
      
      if (blockedRoutes.includes(currentPath)) {
        // Redirigir al login en lugar de retroceder
        history.push('/login');
        return;
      }
      
      // Rutas principales - salir de la app
      const mainRoutes = ['/', '/dashboard', '/usuario'];
      
      if (mainRoutes.includes(currentPath) || !canGoBack) {
        // Mostrar confirmación antes de salir
        if (window.confirm('¿Deseas salir de ESIMEDIA?')) {
          App.exitApp();
        }
      } else {
        // En cualquier otra ruta (incluyendo /login), retroceder
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
