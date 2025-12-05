import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorPages.css';

/**
 * Página de Error 403 - Acceso Prohibido
 */
function ForbiddenPage() {
  return (
    <div className="error-page error-403">
      <div className="error-container">
        <div className="error-code">403</div>
        <div className="error-title">Acceso Prohibido</div>
        <p className="error-message">
          No tienes permiso para acceder a este recurso.
        </p>
        <div className="error-details">
          <p>
            La página o contenido que intentas acceder requiere permisos especiales o está restringido a ciertos usuarios.
          </p>
          <ul className="permission-info">
            <li><i className="fas fa-lock-alt"></i> Este contenido podría ser solo para administradores</li>
            <li><i className="fas fa-star"></i> O podría requerir una suscripción VIP</li>
            <li><i className="fas fa-user-shield"></i> O podría necesitar permisos específicos</li>
          </ul>
        </div>
        <div className="error-actions">
          <Link to="/usuario" className="btn btn-primary">
            <i className="fas fa-home"></i> Ir a Dashboard
          </Link>
          <Link to="/suscripcion" className="btn btn-secondary">
            <i className="fas fa-crown"></i> Ver Suscripciones
          </Link>
        </div>
        <div className="error-illustration">
          <i className="fas fa-shield-alt"></i>
        </div>
      </div>
    </div>
  );
}

export default ForbiddenPage;
