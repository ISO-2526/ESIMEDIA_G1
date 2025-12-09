import { Capacitor } from '@capacitor/core';

/**
 * Configuración de API para múltiples plataformas.
 * 
 * En el navegador (desarrollo), las rutas relativas funcionan con el proxy de React.
 * En Capacitor (Android/iOS), necesitamos la URL completa del backend.
 * 
 * Para emulador Android: 10.0.2.2 apunta al localhost del host.
 * Para dispositivo físico: cambiar a la IP de tu red local.
 */

const getApiBaseUrl = () => {
    // Si estamos en plataforma nativa (Android/iOS)
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
        // Para emulador Android, 10.0.2.2 es el alias del localhost del host
        // Para dispositivo físico, cambia esto a tu IP local (ej: 192.168.1.X)
        return 'http://10.0.2.2:8080';
    }

    // En el navegador, usamos rutas relativas (el proxy de desarrollo las maneja)
    return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper para construir URLs de API
export const buildApiUrl = (path) => {
    const base = API_BASE_URL;
    // Asegurarse de que el path comience con /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${normalizedPath}`;
};

export default {
    API_BASE_URL,
    buildApiUrl
};
