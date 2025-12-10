import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import axios from '../../../api/axiosConfig';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const history = useHistory();

  // Helper: Guardar token de acceso en localStorage
  const saveAccessToken = (data) => {
    if (data.accessToken) {
      localStorage.setItem('access_token', data.accessToken);
      console.log('🔑 Token guardado en localStorage:', data.accessToken);
      console.log('🔍 Verificando token guardado:', localStorage.getItem('access_token'));
    }
  };

  // Helper: Redireccionar según el rol del usuario
  const redirectByRole = (role) => {
    console.log('🚀 Navegando a dashboard con role:', role);
    const routes = {
      admin: '/adminDashboard',
      creator: '/creator',
      user: '/usuario'
    };
    history.push(routes[role] || '/');
  };

  // Helper: Manejar respuesta de login exitoso
  const handleLoginSuccess = async (res) => {
    console.log('✅ Login exitoso:', res.data);
    const data = res.data;
    const role = data?.role ?? data?.data?.role;
    
    saveAccessToken(data);
    await new Promise(resolve => setTimeout(resolve, 100));
    redirectByRole(role);
  };

  // Helper: Manejar requerimiento de 2FA/3FA
  const handle2FARequired = (responseData) => {
    console.log('🔐 Requiere 2FA/3FA - Data recibida:', responseData);
    
    if (responseData && (responseData.email || responseData.role)) {
      history.push({
        pathname: '/validate-2fa',
        state: {
          email: responseData.email || email, 
          password: password,
          role: responseData.role
        }
      });
      return true;
    }
    return false;
  };

  // Helper: Obtener mensaje de error según status HTTP
  const getErrorMessage = (status, data) => {
    const errorMessages = {
      403: 'Usuario bloqueado. Contacta con soporte.',
      429: 'Demasiados intentos. Por favor, espera antes de intentar de nuevo.'
    };

    if (errorMessages[status]) {
      return errorMessages[status];
    }

    if (status === 401) {
      if (data && data.remainingAttempts !== undefined) {
        return `Credenciales inválidas. Intentos restantes: ${data.remainingAttempts}`;
      }
      return 'Credenciales inválidas';
    }

    return data?.message || data?.error || 'Error en el servidor';
  };

  // Helper: Manejar errores de login
  const handleLoginError = (err) => {
    console.error('Error al iniciar sesión:', err);
    console.log('Error response:', err.response);

    if (err.response?.status === 428) {
      const handled = handle2FARequired(err.response.data);
      if (handled) return;
    }

    const errorMsg = getErrorMessage(err.response?.status, err.response?.data);
    setError(errorMsg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      console.log('Base URL configurada:', axios.defaults.baseURL);
      console.log('URL completa a la que se va a hacer la petición:', '/api/auth/login');

      const res = await axios.post('/api/auth/login', { 
        email, 
        password 
      }, {
        withCredentials: true
      });

      await handleLoginSuccess(res);
    } catch (err) {
      handleLoginError(err);
    }
  };

  return (
    <div className="page-container">
      <div className="animated-bg"></div>
      <div className="login-wrapper">
          {/* Panel lateral informativo */}
        <div className="info-panel">
          <div className="info-content">
            <h2 className="info-title">¡Bienvenido de vuelta!</h2>
            <p className="info-description">
              Accede a tu cuenta para disfrutar de todo el contenido exclusivo de ESIMEDIA.
            </p>
            <div className="info-features">
              <div className="feature-item">
                <span className="feature-icon">🎬</span>
                <span className="feature-text">Acceso a tu contenido</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⭐</span>
                <span className="feature-text">Cuenta personalizada</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🚀</span>
                <span className="feature-text">Experiencia premium</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel del formulario */}
        <div className="form-panel">
          <h2 className="page-title">
            <span className="highlight">Iniciar Sesión</span>
          </h2>

          {error && (
            <div style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="email" className="form-label required">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="tu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="password" className="form-label required">Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Contraseña"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Entrar
            </button>

            <div className="form-footer">
              <button type="button" className="link-btn" onClick={() => history.push('/recuperar')}>
                ¿Olvidaste tu contraseña?
              </button>
              <div className="register-link">
                <span>¿No tienes una cuenta? </span>
                <Link to="/registro">Regístrate aquí</Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;