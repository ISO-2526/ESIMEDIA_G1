import React, { useState } from "react";
import { useLocation, useHistory } from "react-router-dom";
import axios from "../../../api/axiosConfig"; // ✅ Asegúrate de que la ruta sea correcta
import './Validate2FA.css';

const Validate2FA = () => {
  const location = useLocation();
  const history = useHistory();
  const email = location.state?.email || "";
  const password = location.state?.password || "";
  const role = location.state?.role || "";
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirigir al login si no hay datos
  React.useEffect(() => {
    if (!email || !password) {
      history.push('/login');
    }
  }, [email, password, history]);

  // Helper: Guardar token de acceso en localStorage
  const saveAccessToken = (data) => {
    if (data.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
      console.log('🔑 Token guardado en localStorage:', data.accessToken);
      console.log('🔍 Verificando token guardado:', localStorage.getItem('access_token'));
    }
  };

  // Helper: Redireccionar según el rol del usuario
  const redirectByRole = (userRole) => {
    console.log('🚀 Navegando a dashboard con role:', userRole);
    const routes = {
      admin: "/adminDashboard",
      creator: "/creator",
      user: "/usuario"
    };
    history.push(routes[userRole] || "/");
  };

  // Helper: Manejar respuesta exitosa de 2FA
  const handle2FASuccess = async (data) => {
    console.log('✅ Validación 2FA exitosa:', data);
    saveAccessToken(data);
    setIsLoading(false);

    if (data.thirdFactorEnabled) {
      history.push("/validate-3fa", { 
        email: data.email || email, 
        role: data.role 
      });
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
    redirectByRole(data.role);
  };

  // Helper: Manejar requerimiento de 3FA (status 428)
  const handle3FARequired = (responseData) => {
    try {
      let data = responseData;
      
      if (typeof data === 'string') {
        console.log('⚠️ Respuesta es HTML/texto, usando datos del state');
        data = { email, role };
      }
      
      console.log('🔐 Redirigiendo a 3FA con:', data);
      history.push("/validate-3fa", { 
        email: data.email || email, 
        role: data.role || role 
      });
    } catch (parseError) {
      console.error('Error parseando respuesta 428:', parseError);
      history.push("/validate-3fa", { email, role });
    }
  };

  // Helper: Extraer mensaje de error de forma segura
  const extractErrorMessage = (errorData) => {
    const defaultMsg = "Código incorrecto o sesión expirada";
    
    try {
      if (errorData && typeof errorData === 'object') {
        return errorData.message || errorData.error || defaultMsg;
      }
    } catch (e) {
      console.error('Error extrayendo mensaje:', e);
    }
    
    return defaultMsg;
  };

  // Helper: Manejar errores de validación
  const handle2FAError = (error) => {
    console.error("❌ Error al validar el token:", error);
    console.log('Error status:', error.response?.status);
    console.log('Error data type:', typeof error.response?.data);

    const status = error.response?.status;

    if (status === 428) {
      handle3FARequired(error.response.data);
      return;
    }

    const errorMessages = {
      401: "Código 2FA incorrecto. Por favor, intenta de nuevo.",
      429: "Demasiados intentos. Por favor, espera antes de intentar de nuevo."
    };

    const message = errorMessages[status] || extractErrorMessage(error.response?.data);
    setMessage(message);
    setIsLoading(false);
  };

  const handleValidate2FA = async () => {
    if (!code || code.length < 6) {
      setMessage("Por favor, ingresa un código válido de 6 dígitos");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      console.log('📱 Validando 2FA con:', { email, hasPassword: !!password, code });
      
      const response = await axios.post("/api/auth/login", {
        email,
        password,
        twoFactorCode: code
      }, {
        withCredentials: true
      });

      await handle2FASuccess(response.data);
    } catch (error) {
      handle2FAError(error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && code.length === 6) {
      handleValidate2FA();
    }
  };

  return (
    <div className="page-container">
      <div className="validate2fa-wrapper">
        {/* Panel informativo lateral */}
        <div className="validate2fa-info-panel">
          <div className="validate2fa-info-content">
            <div className="validate2fa-info-icon">🔒</div>
            <h2 className="validate2fa-info-title">Verificación de Seguridad</h2>
            <p className="validate2fa-info-description">
              Ingresa el código de 6 dígitos que aparece en tu aplicación Google Authenticator 
              para completar el inicio de sesión.
            </p>
            <div className="validate2fa-info-tips">
              <div className="validate2fa-info-tip">
                <span className="validate2fa-tip-icon">📱</span>
                <span>Abre Google Authenticator en tu dispositivo</span>
              </div>
              <div className="validate2fa-info-tip">
                <span className="validate2fa-tip-icon">🔢</span>
                <span>Busca el código de ESIMEDIA</span>
              </div>
              <div className="validate2fa-info-tip">
                <span className="validate2fa-tip-icon">⏱️</span>
                <span>El código cambia cada 30 segundos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel del contenido principal */}
        <div className="validate2fa-content-panel">
          <h1 className="page-title">Validar 2FA</h1>
          <p className="page-subtitle">
            Introduce el código de verificación de tu autenticador para acceder.
          </p>

          <div className="validate2fa-form-field">
            <label htmlFor="validate2fa-code" className="form-label required">
              Código de Autenticación
            </label>
            <input
              id="validate2fa-code"
              type="text"
              className="validate2fa-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyPress={handleKeyPress}
              placeholder="000000"
              maxLength="6"
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="validate2fa-info-box">
            <span className="validate2fa-info-box-icon">💡</span>
            <div>
              Asegúrate de ingresar el código antes de que expire. 
              Si el código no funciona, espera a que se genere uno nuevo.
            </div>
          </div>

          <button 
            onClick={handleValidate2FA}
            disabled={isLoading || code.length < 6}
            className="validate2fa-submit-btn"
          >
            {isLoading ? "Verificando..." : "Validar Código"}
          </button>

          {message && (
            <div className="validate2fa-message">
              {message}
            </div>
          )}

          <div className="validate2fa-footer">
            <button 
              type="button" 
              className="validate2fa-link-btn"
              onClick={() => history.push('/login')}
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Validate2FA;