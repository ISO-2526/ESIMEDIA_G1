import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorPages.css';

/**
 * Página de Error 401 - No Autorizado
 */
function UnauthorizedPage() {
  return (
    <div className="error-page error-401">
      <div className="error-container">
        <div className="error-code">401</div>
        <div className="error-title">No Autorizado</div>
        <p className="error-message">
          Necesitas iniciar sesión para acceder a este recurso.
        </p>
        <div className="error-details">
          <p>
            Tu sesión puede haber expirado o no has iniciado sesión. 
            Por favor, identifícate para continuar.
          </p>
        </div>
        <div className="error-actions">
          <Link to="/login" className="btn btn-primary">
            <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
          </Link>
          <Link to="/" className="btn btn-secondary">
            <i className="fas fa-home"></i> Ir a Inicio
          </Link>
        </div>
        <div className="error-illustration">
          <i className="fas fa-user-lock"></i>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
