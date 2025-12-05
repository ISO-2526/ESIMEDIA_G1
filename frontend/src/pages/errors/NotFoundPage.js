import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorPages.css';

/**
 * Página de Error 404 - Recurso No Encontrado
 */
function NotFoundPage() {
  return (
    <div className="error-page error-404">
      <div className="error-container">
        <div className="error-code">404</div>
        <div className="error-title">Página No Encontrada</div>
        <p className="error-message">
          Lo sentimos, la página que buscas no existe o ha sido removida.
        </p>
        <div className="error-details">
          <p>
            La dirección URL que ingresaste no corresponde a ningún recurso disponible en nuestro servidor.
          </p>
        </div>
        <div className="error-actions">
          <Link to="/" className="btn btn-primary">
            <i className="fas fa-home"></i> Ir a Inicio
          </Link>
          <button onClick={() => window.history.back()} className="btn btn-secondary">
            <i className="fas fa-arrow-left"></i> Volver Atrás
          </button>
        </div>
        <div className="error-illustration">
          <i className="fas fa-search"></i>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
