import React from 'react';
import { Link } from 'react-router-dom';
import './ErrorPages.css';

/**
 * Página de Error 500 - Error Interno del Servidor
 * Tarea 522 - HDU 494
 */
function InternalErrorPage() {
    return (
        <div className="error-page error-500">
            <div className="error-container">
                <div className="error-code">500</div>
                <div className="error-title">Error del Servidor</div>
                <p className="error-message">
                    Ha ocurrido un error inesperado. Estamos trabajando para solucionarlo.
                </p>
                <div className="error-details">
                    <p>
                        Nuestro equipo técnico ha sido notificado del problema. Por favor, intenta de nuevo en unos minutos.
                    </p>
                </div>
                <div className="error-actions">
                    <Link to="/" className="btn btn-primary">
                        <i className="fas fa-home"></i> Ir a Inicio
                    </Link>
                    <button onClick={() => window.location.reload()} className="btn btn-secondary">
                        <i className="fas fa-redo"></i> Reintentar
                    </button>
                </div>
                <div className="error-illustration">
                    <i className="fas fa-server"></i>
                </div>
            </div>
        </div>
    );
}

export default InternalErrorPage;
