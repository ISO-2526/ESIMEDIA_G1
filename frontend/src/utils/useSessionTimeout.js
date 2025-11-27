import { useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { handleLogout as logoutCsrf } from '../auth/logout';

const CONFIG = {
  user:   { idle: 20 * 60 * 1000, absolute: 8 * 60 * 60 * 1000 },
  admin:  { idle: 15 * 60 * 1000, absolute: 7 * 60 * 60 * 1000 },
  creator:{ idle: 15 * 60 * 1000, absolute: 7 * 60 * 60 * 1000 },
};

export default function useSessionTimeout(enabled = true) {
  const history = useHistory();
  const absoluteTimer = useRef(null);
  const idleTimer = useRef(null);
  const expired = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    // El rol se obtiene de localStorage temporalmente hasta que exista /api/auth/me
    // TODO: En el futuro, obtener rol del backend con credentials: 'include'
    const role = (localStorage.getItem('role') || 'user').toLowerCase();

    const { idle, absolute } = CONFIG[role] || CONFIG.user;

    const doLogout = () => {
      if (expired.current) return;
      expired.current = true;
      // Sin modal/confirmaciones
      logoutCsrf('/login', history);
    };

    const startIdle = () => {
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(doLogout, idle);
    };

    const startAbsolute = () => {
      clearTimeout(absoluteTimer.current);
      absoluteTimer.current = setTimeout(doLogout, absolute);
    };

    const activity = () => {
      if (!expired.current) startIdle();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, activity, { passive: true }));

    startIdle();
    startAbsolute();

    return () => {
      events.forEach(e => window.removeEventListener(e, activity));
      clearTimeout(idleTimer.current);
      clearTimeout(absoluteTimer.current);
    };
  }, [history, enabled]);
}