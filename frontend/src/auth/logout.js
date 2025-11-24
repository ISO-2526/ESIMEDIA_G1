export const handleLogout = async (redirect = '/login', navigateFn) => {
  const getCsrf = () =>
    document.cookie.split('; ').find(s => s.startsWith('csrf_token='))?.split('=')[1];

  try {
    const csrf = getCsrf();
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: csrf ? { 'X-CSRF-Token': decodeURIComponent(csrf) } : {}
    });
  } catch (e) {
    console.error('Error al cerrar sesión:', e);
  } finally {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('session');
    } catch {}
    if (navigateFn) {
      navigateFn(redirect, { replace: true });
    } else {
      window.location.href = redirect;
    }
  }
};