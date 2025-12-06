import axios from '../api/axiosConfig';

export const handleLogout = async (redirect = '/', navigateFn) => {
  const getCsrf = () =>
    document.cookie.split('; ').find(s => s.startsWith('csrf_token='))?.split('=')[1];

  console.log('🚪 Iniciando logout...');
  
  try {
    const csrf = getCsrf();
    // ✅ Usar axios para que funcione correctamente en móvil con 10.0.2.2
    await axios.post('/api/auth/logout', {}, {
      withCredentials: true,
      headers: csrf ? { 'X-CSRF-Token': decodeURIComponent(csrf) } : {}
    });
    console.log('✅ Logout exitoso en servidor');
  } catch (e) {
    console.error('❌ Error al cerrar sesión en servidor:', e);
  } finally {
    try {
      console.log('🧹 Limpiando localStorage...');
      // ⚠️ HYBRID STRATEGY: Limpiar access_token usado por móvil
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('session');
      
      console.log('🍪 Limpiando cookies...');
      // 🍪 Eliminar cookies explícitamente (importante para localhost en móvil)
      // Probar múltiples dominios para asegurar limpieza completa
      const cookieOptions = [
        '; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;',
        '; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;',
        '; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=10.0.2.2;',
        '; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.localhost;'
      ];
      
      const cookieNames = ['access_token', 'csrf_token', 'JSESSIONID'];
      
      cookieNames.forEach(name => {
        cookieOptions.forEach(options => {
          document.cookie = `${name}=${options}`;
        });
      });
      
      console.log('✅ Limpieza completa');
    } catch (e) {
      console.error('❌ Error limpiando datos:', e);
    }
    
    // 🔄 FORZAR RECARGA COMPLETA para limpiar estado de React
    // Pequeño delay para asegurar que las cookies se limpien
    console.log('🔄 Redirigiendo a:', redirect);
    setTimeout(() => {
      window.location.href = redirect;
    }, 100);
  }
};