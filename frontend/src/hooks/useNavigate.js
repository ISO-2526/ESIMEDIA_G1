import { useHistory } from 'react-router-dom';
import { useIonRouter } from '@ionic/react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook personalizado para navegación híbrida móvil/web
 * Usa useIonRouter para móvil y useHistory para web
 */
export const useNavigate = () => {
    const history = useHistory();
    let ionRouter = null;

    // Solo intentar usar useIonRouter si estamos en móvil
    const isMobile = Capacitor.isNativePlatform();

    try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        ionRouter = useIonRouter();
    } catch (e) {
        // No está dentro de IonReactRouter, usar solo history
    }

    const navigate = (path, state = null) => {
        console.log('🚀 useNavigate:', path, 'isMobile:', isMobile);

        if (isMobile && ionRouter) {
            // En móvil, guardar state en sessionStorage y usar ionRouter
            if (state) {
                sessionStorage.setItem('navigationState', JSON.stringify(state));
            }
            ionRouter.push(path, 'forward', 'push');
        } else {
            // En web, usar history normal
            if (state) {
                history.push({ pathname: path, state });
            } else {
                history.push(path);
            }
        }
    };

    const goBack = () => {
        if (isMobile && ionRouter && ionRouter.canGoBack()) {
            ionRouter.goBack();
        } else {
            history.goBack();
        }
    };

    return { navigate, goBack, isMobile };
};

export default useNavigate;
