import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory, useLocation } from 'react-router-dom';
import './ResetPassword.css';
import { validatePasswordStrength } from '../../../utils/passwordDictionary';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isValidToken, setIsValidToken] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const history = useHistory();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false);
        return;
      }

      try {
        // ✅ Hacemos GET con el token en la query, como espera tu backend
        const response = await axios.get(`/api/auth/validate-reset-token?token=${(token)}`);
        
        // ✅ Usamos el valor devuelto por el backend
        if (response.data?.valid === true) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
        }
      } catch (error) {
        console.error('Error al validar token:', error.response?.data || error.message);
        setIsValidToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    
    // Validar contraseña en tiempo real
    const errors = validatePasswordStrength(value);
    if (errors.length > 0) {
      setPasswordError(errors[0]);
    } else {
      setPasswordError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Las contraseñas no coinciden.');
      setMessageType('error');
      return;
    }

    // Validar fortaleza de la contraseña
    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      setMessage(passwordErrors[0]);
      setMessageType('error');
      return;
    }

    try {
      const response = await axios.post('/api/auth/reset-password', { token, password });
      setMessage(response.data.message || 'Contraseña restablecida correctamente. Redirigiendo al inicio de sesión...');
      setMessageType('success');
      setTimeout(() => history.push('/login'), 3000);
    } catch (error) {
      console.error('Error al resetear contraseña:', error.response?.data || error.message);
      setMessage('Error al resetear la contraseña. Inténtalo de nuevo.');
      setMessageType('error');
    }
  };

  if (isValidToken === null) {
    return (
      <div className="page-container">
        <div className="reset-wrapper">
          <div className="reset-form-panel">
            <p className="reset-loading">Verificando enlace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="page-container">
        <div className="reset-wrapper">
          <div className="reset-form-panel">
            <p className="reset-invalid-token">
              ⚠️ El enlace de restablecimiento no es válido o ha expirado.
            </p>
            <button 
              className="reset-submit-btn"
              onClick={() => history.push('/recover-password')}
              style={{ marginTop: '20px' }}
            >
              Solicitar nuevo enlace
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="reset-wrapper">
        {/* Panel informativo lateral */}
        <div className="reset-info-panel">
          <div className="reset-info-content">
            <div className="reset-info-icon">🔑</div>
            <h2 className="reset-info-title">Nueva Contraseña</h2>
            <p className="reset-info-description">
              Crea una contraseña segura para proteger tu cuenta.
            </p>
            
            <div className="reset-info-features">
              <div className="reset-feature-item">
                <span className="reset-feature-icon">✓</span>
                <span className="reset-feature-text">Mínimo 8 caracteres</span>
              </div>
              <div className="reset-feature-item">
                <span className="reset-feature-icon">✓</span>
                <span className="reset-feature-text">Letras mayúsculas y minúsculas</span>
              </div>
              <div className="reset-feature-item">
                <span className="reset-feature-icon">✓</span>
                <span className="reset-feature-text">Números y símbolos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel del formulario */}
        <div className="reset-form-panel">
          <h1 className="page-title">Restablecer Contraseña</h1>
          <p className="page-subtitle">
            Introduce tu nueva contraseña a continuación.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="reset-password" className="form-label required">Nueva Contraseña</label>
              <div className="reset-password-input-wrapper">
                <input
                  id="reset-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="Introduce tu nueva contraseña"
                  required
                />
                <button
                  type="button"
                  className="reset-toggle-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
              {passwordError && (
                <p style={{ color: '#ff4444', fontSize: '12px', marginTop: '8px' }}>
                  ⚠️ {passwordError}
                </p>
              )}
              {password && !passwordError && (
                <p style={{ color: '#4CAF50', fontSize: '12px', marginTop: '8px' }}>
                  ✓ Contraseña válida
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="reset-confirm-password" className="form-label required">Confirmar Nueva Contraseña</label>
              <div className="reset-password-input-wrapper">
                <input
                  id="reset-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu nueva contraseña"
                  required
                />
                <button
                  type="button"
                  className="reset-toggle-password-btn"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showConfirmPassword ? (
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

            <button 
              type="submit" 
              className="reset-submit-btn"
              disabled={!password || !confirmPassword || password !== confirmPassword}
            >
              Restablecer Contraseña
            </button>
          </form>

          {message && (
            <p className={`reset-message ${messageType}`}>{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
