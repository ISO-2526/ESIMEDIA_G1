import React, { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import axios from "axios";
import './Setup2FA.css';

const Setup2FA = () => {
  const location = useLocation();
  const history = useHistory();
  const email = location.state?.email || '';
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  // Verificar que se recibió el email, si no redirigir al registro
  useEffect(() => {
    if (!email || email.trim() === '') {
      console.error('❌ No se recibió el email para setup 2FA');
      setError('No se pudo obtener el email. Volviendo al registro...');
      setTimeout(() => {
        history.push('/registro');
      }, 2000);
    } else {
      console.log('✅ Email recibido para setup 2FA:', email);
    }
  }, [email, history]);

  const handleSetup2FA = async () => {
    if (!email || email.trim() === '') {
      setError("No se pudo obtener el correo electrónico. Por favor, regístrate nuevamente.");
      return;
    }

    setIsButtonDisabled(true);
    console.log('🔐 Solicitando setup 2FA para email:', email);
    
    try {
      const response = await axios.get("/api/auth/2fa/setup", {
        params: { email },
      });
      console.log('✅ Setup 2FA exitoso:', response.data);
      setQrCodeUrl(response.data.qrCodeUrl);
      setSecretKey(response.data.secretKey);
      setError("");
    } catch (err) {
      console.error('❌ Error en setup 2FA:', err);
      setError(err.response?.data?.error || "Error al configurar 2FA. Verifica el correo electrónico.");
      setIsButtonDisabled(false);
    }
  };

  const handleContinue = () => {
    history.push('/login');
  };

  return (
    <div className="page-container">
      <div className="setup2fa-wrapper">
        {/* Panel informativo lateral */}
        <div className="setup2fa-info-panel">
          <div className="setup2fa-info-content">
            <div className="setup2fa-info-icon">🔐</div>
            <h2 className="setup2fa-info-title">Autenticación de Dos Factores</h2>
            <p className="setup2fa-info-description">
              Protege tu cuenta con una capa adicional de seguridad. La autenticación de dos factores 
              añade una protección extra contra accesos no autorizados.
            </p>
            <div className="setup2fa-info-steps">
              <div className="setup2fa-info-step">
                <span className="setup2fa-step-number">1</span>
                <span>Instala Google Authenticator en tu dispositivo móvil</span>
              </div>
              <div className="setup2fa-info-step">
                <span className="setup2fa-step-number">2</span>
                <span>Genera tu clave secreta</span>
              </div>
              <div className="setup2fa-info-step">
                <span className="setup2fa-step-number">3</span>
                <span>Introduce la clave en Google Authenticator</span>
              </div>
              <div className="setup2fa-info-step">
                <span className="setup2fa-step-number">4</span>
                <span>¡Listo! Tu cuenta está protegida</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel del contenido principal */}
        <div className="setup2fa-content-panel">
          <h1 className="page-title">Configurar 2FA</h1>
          <p className="page-subtitle">
            Configura la autenticación de dos factores para mantener tu cuenta segura.
          </p>

          {!qrCodeUrl && !error && (
            <div className="setup2fa-info-box">
              <span className="setup2fa-info-box-icon">💡</span>
              <div>
                Haz clic en el botón para generar tu código de configuración. 
                Necesitarás tener Google Authenticator instalado en tu dispositivo móvil.
              </div>
            </div>
          )}

          <button 
            onClick={handleSetup2FA} 
            disabled={isButtonDisabled}
            className="setup2fa-generate-btn"
          >
            {isButtonDisabled ? "Generando..." : "Generar Código de Seguridad"}
          </button>

          {qrCodeUrl && (
            <div className="setup2fa-result">
              <h3 className="setup2fa-result-title">¡Tu código ha sido generado!</h3>
              <p className="setup2fa-instruction">
                Introduce la siguiente clave secreta en Google Authenticator manualmente:
              </p>
              
              <div className="setup2fa-secret-container">
                <span className="setup2fa-secret-label">Clave Secreta</span>
                <div className="setup2fa-secret-key" title="Haz clic para seleccionar">
                  {secretKey}
                </div>
              </div>

              <button onClick={handleContinue} className="setup2fa-continue-btn">
                Continuar al Login
              </button>
            </div>
          )}

          {error && (
            <div className="setup2fa-error">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setup2FA;