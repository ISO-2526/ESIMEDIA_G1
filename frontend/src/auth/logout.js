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
      // ⚠️ HYBRID STRATEGY: Limpiar access_token usado por móvil
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('session');
      
      // 🍪 Eliminar cookies explícitamente (importante para localhost en móvil)
      // Establecer cookies con valor vacío y fecha de expiración en el pasado
      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'JSESSIONID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    } catch {}
    if (navigateFn) {
      navigateFn.push(redirect);
    } else {
      window.location.href = redirect;
    }
  }
};