import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorPages.css';

/**
 * Página de Error 500 - Error Interno del Servidor
 */
function ServerErrorPage() {
  return (
    <div className="error-page error-500">
      <div className="error-container">
        <div className="error-code">500</div>
        <div className="error-title">Error del Servidor</div>
        <p className="error-message">
          Algo salió mal en nuestros servidores.
        </p>
        <div className="error-details">
          <p>
            Estamos trabajando para solucionar el problema. 
            Por favor, intenta nuevamente en unos minutos.
          </p>
        </div>
        <div className="error-actions">
          <Link to="/" className="btn btn-primary">
            <i className="fas fa-home"></i> Ir a Inicio
          </Link>
          <button onClick={() => window.location.reload()} className="btn btn-secondary">
            <i className="fas fa-redo"></i> Recargar Página
          </button>
        </div>
        <div className="error-illustration">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
      </div>
    </div>
  );
}

export default ServerErrorPage;
