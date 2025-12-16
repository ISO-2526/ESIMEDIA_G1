import React from 'react';
import PropTypes from 'prop-types';
import './CreatorTopBar.css';
import { handleLogout as logoutCsrf } from '../../auth/logout';
import { useHistory } from 'react-router-dom';

export default function CreatorTopBar({ photoUrl, menuOpen, onToggleMenu, onLogout, onViewProfile, onEditProfile }) {
  const history = useHistory();
  // si se quiere forzar el nuevo logout desde aquí:
  const doLogout = () => logoutCsrf(history, '/login');
  return (
    <div className="creator-user-menu-container">
      <div 
        className="creator-user-avatar"
        onClick={onToggleMenu}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleMenu(); } }}
        role="button"
        tabIndex={0}
        aria-haspopup="menu" 
        aria-expanded={menuOpen}
        aria-label="Menú de usuario"
      >
        <img 
          src={photoUrl || '/pfp/avatar1.png'} 
          alt="Foto de perfil del creador" 
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      </div>
      
      {menuOpen && (
        <div className="creator-user-dropdown" role="menu">
          <button className="creator-dropdown-item" onClick={onViewProfile}>
            <i className="fas fa-user-circle"></i> Ver Perfil
          </button>
          <button className="creator-dropdown-item" onClick={onEditProfile}>
            <i className="fas fa-user-edit"></i> Editar Perfil
          </button>
          <div className="creator-dropdown-divider"></div>
          <button className="creator-dropdown-item creator-logout-btn" onClick={onLogout || doLogout}>
            <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
}

CreatorTopBar.propTypes = {
  photoUrl: PropTypes.string,
  menuOpen: PropTypes.bool.isRequired,
  onToggleMenu: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired,
  onViewProfile: PropTypes.func.isRequired,
  onEditProfile: PropTypes.func.isRequired,
};

CreatorTopBar.defaultProps = {
  photoUrl: null,
};
