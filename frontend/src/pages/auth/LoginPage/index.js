import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { useIonRouter } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import axios from '../../../api/axiosConfig';
import './LoginPage.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const history = useHistory();
  const ionRouter = useIonRouter();
  const isMobile = Capacitor.isNativePlatform();

  // Función de navegación híbrida
  const navigate = (path, state = null) => {
    console.log('🚀 Navegando a:', path, 'con state:', state);
    if (isMobile && ionRouter) {
      // En móvil, usar ionRouter con state en sessionStorage
      if (state) {
        sessionStorage.setItem('navigationState', JSON.stringify(state));
      }
      ionRouter.push(path, 'forward', 'push');
    } else {
      // En web, usar history normal
      if (state) {
        history.push({ pathname: path, state });
      } else {
        history.push(path);
      }
    }
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

      console.log('✅ Login exitoso:', res.data);

      // Login exitoso sin 2FA/3FA requerido
      const data = res.data;
      const role = data?.role ?? data?.data?.role;

      // ⚠️ HYBRID STRATEGY: Guardar token para móvil (respaldo si fallan cookies)
      if (data.accessToken) {
        localStorage.setItem('access_token', data.accessToken);
        console.log('🔑 Token guardado en localStorage:', data.accessToken);
      }

      // Pequeño delay para asegurar que localStorage se sincroniza
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('🚀 Navegando a dashboard con role:', role);
      if (role === 'admin') navigate('/adminDashboard');
      else if (role === 'creator') navigate('/creator');
      else if (role === 'user') navigate('/usuario');
      else navigate('/');

    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      console.log('Error response:', err.response);

      // ✅ Manejar código 428: Requiere 2FA o 3FA
      if (err.response?.status === 428) {
        const responseData = err.response.data;

        console.log('🔐 Requiere 2FA/3FA - Data recibida:', responseData);

        // Verificar si tiene los datos necesarios
        if (responseData && (responseData.email || responseData.role)) {
          navigate('/validate-2fa', {
            email: responseData.email || email,
            password: password,
            role: responseData.role
          });
          return;
        }
      }

      // Manejar otros errores HTTP
      if (err.response?.status === 403) {
        setError('Usuario bloqueado. Contacta con soporte.');
      } else if (err.response?.status === 401) {
        const errorData = err.response.data;
        if (errorData && errorData.remainingAttempts !== undefined) {
          setError(`Credenciales inválidas. Intentos restantes: ${errorData.remainingAttempts}`);
        } else {
          setError('Credenciales inválidas');
        }
      } else if (err.response?.status === 429) {
        setError('Demasiados intentos. Por favor, espera antes de intentar de nuevo.');
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || 'Error en el servidor');
      }
    }
  };

  const content = (
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
              <button type="button" className="link-btn" onClick={() => navigate('/recuperar')}>
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

  if (Capacitor.isNativePlatform()) {
    return (
      <IonPage>
        <IonContent fullscreen>
          {content}
        </IonContent>
      </IonPage>
    );
  }

  return content;
}

export default LoginPage;