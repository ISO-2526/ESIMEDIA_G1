import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { App } from '@capacitor/app';

const BackButtonHandler = () => {
  const history = useHistory();

  useEffect(() => {
    const backButtonListener = App.addListener('backButton', () => {
      const currentPath = history.location.pathname;
      
      // Si estamos en la ruta principal , salir de la app
      if (currentPath === '/') {
        App.exitApp();
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
