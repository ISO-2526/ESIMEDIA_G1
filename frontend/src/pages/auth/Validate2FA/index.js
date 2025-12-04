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

  const handleValidate2FA = async () => {
    if (!code || code.length < 6) {
      setMessage("Por favor, ingresa un código válido de 6 dígitos");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      console.log('📱 Validando 2FA con:', { email, hasPassword: !!password, code });
      
      // ✅ Enviar twoFactorCode (no "2fa_code")
      const response = await axios.post("/api/auth/login", {
        email,
        password,
        twoFactorCode: code  // ✅ Cambiado de "2fa_code" a "twoFactorCode"
      }, {
        withCredentials: true
      });

      console.log('✅ Validación 2FA exitosa:', response.data);
      const data = response.data;

      // ⚠️ HYBRID STRATEGY: Guardar token para móvil (respaldo si fallan cookies)
      if (data.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
        console.log('🔑 Token guardado en localStorage:', data.accessToken);
        console.log('🔍 Verificando token guardado:', localStorage.getItem('access_token'));
      }

      // ✅ Desactivar loading ANTES de navegar
      setIsLoading(false);

      // Verificar si el usuario tiene activado el 3FA
      if (data.thirdFactorEnabled) {
        history.push("/validate-3fa", { 
          email: data.email || email, 
          role: data.role 
        });
        return;
      }

      // Pequeño delay para asegurar que localStorage se sincroniza
      // antes de que ProtectedRoute intente validar el token
      await new Promise(resolve => setTimeout(resolve, 100));

      // Redirigir según el rol
      console.log('🚀 Navegando a dashboard con role:', data.role);
      if (data.role === "admin") {
        history.push("/adminDashboard");
      } else if (data.role === "creator") {
        history.push("/creator");
      } else if (data.role === "user") {
        history.push("/usuario");
      } else {
        history.push("/");
      }

    } catch (error) {
      console.error("❌ Error al validar el token:", error);
      console.log('Error status:', error.response?.status);
      console.log('Error data type:', typeof error.response?.data);
      
      // Si después del 2FA se requiere 3FA
      if (error.response?.status === 428) {
        try {
          // Intentar parsear responseData de forma segura
          let responseData = error.response.data;
          
          // Si data es string (HTML), no intentar parsearlo
          if (typeof responseData === 'string') {
            console.log('⚠️ Respuesta es HTML/texto, usando datos del state');
            responseData = { email, role };
          }
          
          console.log('🔐 Redirigiendo a 3FA con:', responseData);
          history.push("/validate-3fa", { 
            email: responseData.email || email, 
            role: responseData.role || role 
          });
          return;
        } catch (parseError) {
          console.error('Error parseando respuesta 428:', parseError);
          history.push("/validate-3fa", { email, role });
          return;
        }
      }

      // Errores de autenticación
      if (error.response?.status === 401) {
        setMessage("Código 2FA incorrecto. Por favor, intenta de nuevo.");
      } else if (error.response?.status === 429) {
        setMessage("Demasiados intentos. Por favor, espera antes de intentar de nuevo.");
      } else {
        // Manejar respuestas no-JSON de forma segura
        let errorMsg = "Código incorrecto o sesión expirada";
        
        try {
          if (error.response?.data && typeof error.response.data === 'object') {
            errorMsg = error.response.data.message || 
                      error.response.data.error || 
                      errorMsg;
          }
        } catch (e) {
          console.error('Error extrayendo mensaje:', e);
        }
        
        setMessage(errorMsg);
      }
      setIsLoading(false);
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