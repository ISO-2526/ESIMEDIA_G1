import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import useSessionTimeout from '../utils/useSessionTimeout';
import axios from '../api/axiosConfig'; // ✅ Usar axios con CapacitorHttp

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null mientras se valida el token
  const [userRole, setUserRole] = useState(null); // Rol del usuario

  // NUEVO: activar timeout solo cuando la sesión es válida y en rutas protegidas
  useSessionTimeout(isAuthenticated === true);

  useEffect(() => {
    const validateToken = async () => {
      try {
        console.log('🔐 Validando token desde ProtectedRoute...');
        const response = await axios.get('/api/auth/validate-token', {
          withCredentials: true
        });
        console.log('✅ Token válido:', response.data);
        const role = response.data?.role ?? response.data?.data?.role;
        setUserRole(role);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('❌ Error al validar el token:', error);
        console.log('Error status:', error.response?.status);
        setIsAuthenticated(false);
      }
    };
    validateToken();
  }, []);

  if (isAuthenticated === null) {
    // Mostrar un indicador de carga mientras se valida el token
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    // Redirigir al inicio de sesión si no está autenticado
    return <Redirect to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirigir según el rol del usuario si no tiene acceso
    if (userRole === 'admin') return <Redirect to="/adminDashboard" />;
    if (userRole === 'creator') return <Redirect to="/creator" />;
    if (userRole === 'user') return <Redirect to="/usuario" />;
  }

  // Renderizar el contenido protegido si está autenticado y tiene acceso
  return children;
};

export default ProtectedRoute;