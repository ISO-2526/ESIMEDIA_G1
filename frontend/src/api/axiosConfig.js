import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { Capacitor } from '@capacitor/core';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ CRÍTICO: Enviar cookies en TODAS las peticiones (para Web)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ⚠️ HYBRID STRATEGY: Interceptor REQUEST - Inyectar Bearer Token si existe (para Móvil)
axiosInstance.interceptors.request.use(
  (config) => {
    // Si hay token manual (porque fallaron las cookies en móvil), úsalo
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token Bearer inyectado en header Authorization');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor RESPONSE - Manejar respuestas de error en móvil
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la respuesta es HTML en lugar de JSON, intentar parsear
    if (error.response && typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE')) {
      console.warn('⚠️ Respuesta HTML detectada, convirtiendo a error JSON');
      error.response.data = {
        error: 'Error del servidor',
        message: 'La respuesta del servidor no es válida',
        status: error.response.status
      };
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;