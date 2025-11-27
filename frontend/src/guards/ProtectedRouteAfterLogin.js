import React, { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';

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
  if (state.role === "admin") return <Redirect to="/adminDashboard" />;
  if (state.role === "creator") return <Redirect to="/creator" />;
  if (state.role === "user") return <Redirect to="/usuario" />;
  return <Redirect to="/" />;
};

export default ProtectedRouteAfterLogin;