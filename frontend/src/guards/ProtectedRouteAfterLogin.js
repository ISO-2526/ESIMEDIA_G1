import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRouteAfterLogin = ({ children }) => {
  const [state, setState] = useState({ loading: true, role: null });

  useEffect(() => {
    let alive = true;
    fetch('/api/auth/validate-token', { method: 'GET', credentials: 'include' })
      .then(async (r) => {
        if (!alive) return;
        if (r.ok) {
          const data = await r.json();
          setState({ loading: false, role: data?.role ?? data?.data?.role });
        } else {
          setState({ loading: false, role: null });
        }
      })
      .catch(() => alive && setState({ loading: false, role: null }));
    return () => { alive = false; };
  }, []);

  if (state.loading) return children;
  if (!state.role) return children;
  if (state.role === "admin") return <Navigate to="/adminDashboard" replace />;
  if (state.role === "creator") return <Navigate to="/creator" replace />;
  if (state.role === "user") return <Navigate to="/usuario" replace />;
  return <Navigate to="/" replace />;
};

export default ProtectedRouteAfterLogin;