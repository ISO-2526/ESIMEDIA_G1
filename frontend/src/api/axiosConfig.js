import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const axiosInstance = axios.create({
  baseURL: Capacitor.isNativePlatform() ? 'http://10.0.2.2:8080' : 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar respuestas de error en móvil
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