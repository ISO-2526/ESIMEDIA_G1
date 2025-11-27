import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import './UserNavbar.css';
import logo from './logo.svg';

function UserNavbar({ username }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const history = useHistory();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  

  const handleProfile = () => {
    console.log('Ir a Mi Perfil');
    setMenuOpen(false);
    history.push('/perfil');
  };
  const handleDashboard = () => {
    console.log('Ir a Dashboard');
    setMenuOpen(false);
    history.push('/usuario');   
  };

  const handleSubscription = () => {
    console.log('Ir a Suscripción');
    // navigate('/suscripcion'); // Implementar más adelante
  };

  const handleLogout = async () => {
    try {
      const csrf = document.cookie.split('; ').find(s => s.startsWith('csrf_token='))?.split('=')[1];
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
      window.location.href = '/login';
    }
  };

  return (
    <nav className="user-navbar">
      <div className="navbar-logo">
        <img src={logo} alt="ESIMEDIA Logo" />
      </div>
      
      <div className="navbar-welcome">
        Bienvenido {username}
      </div>

      <div className="navbar-user">
        <div 
          className="user-icon" 
          onClick={toggleMenu}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); } }}
          role="button"
          tabIndex={0}
          aria-label="Abrir menú de usuario"
        >
          <span>👤</span>
        </div>
        
        {menuOpen && (
          <div className="user-menu">
            <div 
              className="menu-item" 
              onClick={handleDashboard}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDashboard(); } }}
              role="button"
              tabIndex={0}
            >
                <span>🏠</span> Inicio
            </div>
            <div 
              className="menu-item" 
              onClick={handleProfile}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleProfile(); } }}
              role="button"
              tabIndex={0}
            >
              <span>👤</span> Mi Perfil
            </div>
            <div 
              className="menu-item" 
              onClick={handleSubscription}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSubscription(); } }}
              role="button"
              tabIndex={0}
            >
              <span>💳</span> Suscripción
            </div>
            <div 
              className="menu-item" 
              onClick={handleLogout}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleLogout(); } }}
              role="button"
              tabIndex={0}
            >
              <span>🚪</span> Cerrar Sesión
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default UserNavbar;