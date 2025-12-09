import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { Capacitor } from '@capacitor/core';

/**
 * Higher Order Component that wraps pages in IonPage/IonContent for mobile
 * This is required for pages to render correctly inside IonRouterOutlet
 */
const withMobilePage = (WrappedComponent) => {
    return function MobilePageWrapper(props) {
        const isMobile = Capacitor.isNativePlatform();

        if (isMobile) {
            return (
                <IonPage>
                    <IonContent fullscreen>
                        <WrappedComponent {...props} />
                    </IonContent>
                </IonPage>
            );
        }

        return <WrappedComponent {...props} />;
    };
};

/**
 * Component wrapper for use in JSX when you can't use HOC directly
 */
export const MobilePage = ({ children }) => {
    const isMobile = Capacitor.isNativePlatform();

    if (isMobile) {
        return (
            <IonPage>
                <IonContent fullscreen>
                    {children}
                </IonContent>
            </IonPage>
        );
    }

    return <>{children}</>;
};

export default withMobilePage;
