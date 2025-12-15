import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import axios from '../api/axiosConfig';

const ProtectedRouteAfterLogin = ({ children }) => {
  const [state, setState] = useState({ loading: true, role: null });

  useEffect(() => {
    let alive = true;
    axios.get('/api/auth/validate-token', { withCredentials: true })
      .then((response) => {
        if (!alive) return;
        const data = response.data;
        console.log('✅ ProtectedRouteAfterLogin - Token válido, role:', data?.role);
        setState({ loading: false, role: data?.role ?? data?.data?.role });
      })
      .catch((error) => {
        console.log('⚠️ ProtectedRouteAfterLogin - No autenticado:', error.response?.status);
        if (alive) setState({ loading: false, role: null });
      });
    return () => { alive = false; };
  }, []);

  if (state.loading) return children;
  if (!state.role) return children;
  if (state.role === "admin") return <Redirect to="/adminDashboard" />;
  if (state.role === "creator") return <Redirect to="/creator" />;
  if (state.role === "user") return <Redirect to="/usuario" />;
  return <Redirect to="/" />;
};

export default ProtectedRouteAfterLogin;