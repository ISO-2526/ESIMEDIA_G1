import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Capacitor } from '@capacitor/core';

/**
 * HOC que envuelve componentes en IonPage/IonContent para plataformas móviles
 * Solo envuelve si es móvil y el componente aún no está envuelto
 */
export const withMobileWrapper = (Component) => {
  return function MobileWrappedComponent(props) {
    const isMobile = Capacitor.isNativePlatform();

    // Si no es móvil, retornar componente sin cambios
    if (!isMobile) {
      return <Component {...props} />;
    }

    // En móvil, envolver con IonPage e IonContent
    return (
      <IonPage>
        <IonContent fullscreen>
          <Component {...props} />
        </IonContent>
      </IonPage>
    );
  };
};
