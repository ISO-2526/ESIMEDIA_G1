import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import './DarAltaCuenta.css';
import '../AdminDashboard/AdminDashboard.css';
import { validatePasswordStrength } from '../../../utils/passwordDictionary';

function DarAltaCuenta() {
  const history = useHistory();
  const getSession = async () => {
    try {
      const res = await fetch('/api/auth/validate-token', { credentials: 'include' });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  };
  const [type, setType] = useState('admin');
  const [form, setForm] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    department: 'CUSTOMER_SUPPORT',
    alias: '',
    specialty: 'FICTION',
    contentType: 'VIDEO',
    description: '',
    picture: 'avatar1.png'
  });

  const [status, setStatus] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorSecretKey, setTwoFactorSecretKey] = useState(''); // Nuevo estado para la clave secreta
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // Validar contraseña en tiempo real
    if (name === 'password') {
      const errors = validatePasswordStrength(value);
      if (errors.length > 0) {
        setPasswordError(errors[0]);
      } else {
        setPasswordError('');
      }
    }
  };

  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  // Add these helper functions before handleSubmit
  const validateRequiredFields = (type, form) => {
    if (type === 'admin') {
      if (!form.name || !form.surname || !form.email || !form.password || !form.department || !form.picture) {
        return 'Missing required admin fields';
      }
    } else if (!form.name || !form.surname || !form.email || !form.password || !form.alias || !form.specialty || !form.contentType || !form.picture) {
      return 'Missing required content creator fields';
    }
    return null;
  };
  const createPayload = (type, form) => {
    // ✅ Validar política de contraseñas con información personal
    const passwordErrors = validatePasswordStrength(
      form.password,
      form.email,
      form.name,
      form.surname,
      type === 'creator' ? form.alias : null
    );

    if (passwordErrors.length > 0) {
      setStatus(passwordErrors[0]);
      setPasswordError(passwordErrors[0]);
      return null;
    }

    if (type === 'admin') {
      return {
        name: form.name,
        surname: form.surname,
        email: form.email,
        password: form.password,
        department: form.department,
        picture: `/pfp/${form.picture}`
      };
    }

    return {
      name: form.name,
      surname: form.surname,
      email: form.email,
      password: form.password,
      alias: form.alias,
      description: form.description,
      specialty: form.specialty,
      contentType: form.contentType,
      picture: `/pfp/${form.picture}`
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Saving...');
    
    const session = await getSession();
    if (!session || session.role !== 'admin') { setStatus('No autorizado'); return; }

    // Validate required fields
    const validationError = validateRequiredFields(type, form);
    if (validationError) {
      setStatus(validationError);
      return;
    }

    // Validate password strength
    const passwordErrors = validatePasswordStrength(form.password);
    if (passwordErrors.length > 0) {
      setStatus(passwordErrors[0]);
      setPasswordError(passwordErrors[0]);
      return;
    }

    const url = type === 'admin' ? '/api/admins/admin' : '/api/admins/creator';
    const payload = createPayload(type, form);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ← enviar cookies (access_token)
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const text = await res.text();
        setStatus(`Error: ${text}`);
        return;
      }
      
      const data = await res.json();
      setStatus('Created: ' + (data.email || 'success'));
      setTwoFactorSecretKey(data.twoFactorSecretKey);
      setForm(prev => ({ ...prev, name: '', surname: '', email: '', password: '', alias: '' }));
    } catch (err) {
      setStatus('Request failed: ' + err.message);
    }
  };

  // Extract nested ternary operation into a function
  const getStatusClassName = () => {
    if (status?.includes('Error') || status?.includes('Missing')) {
      return 'dar-alta-status error';
    }
    if (status?.includes('Saving')) {
      return 'dar-alta-status loading';
    }
    if (status) {
      return 'dar-alta-status success';
    }
    return 'dar-alta-status';
  };

  return (
    <div className="dar-alta-container">
      {/* Header */}
      <header className="dar-alta-header">
        <div className="dar-alta-header-content">
          <button onClick={() => history.push('/adminDashboard')} className="dar-alta-back-btn">
            ← Volver
          </button>
          <h1 className="dar-alta-header-title">Dar Cuenta de Alta</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="dar-alta-main">
        {/* Type Selector */}
        <div className="dar-alta-type-selector">
          <h3 className="dar-alta-type-title">Tipo de cuenta</h3>
          <div className="dar-alta-type-options">
            <div className="dar-alta-type-option">
              <input 
                type="radio" 
                name="type" 
                value="admin" 
                checked={type==='admin'} 
                onChange={() => setType('admin')} 
                id="type-admin"
                className="dar-alta-type-radio"
              />
              <label htmlFor="type-admin" className="dar-alta-type-label">
                <span className="dar-alta-type-icon">👨‍💼</span>
                <span>Administrador</span>
              </label>
            </div>
            <div className="dar-alta-type-option">
              <input 
                type="radio" 
                name="type" 
                value="creator" 
                checked={type==='creator'} 
                onChange={() => setType('creator')} 
                id="type-creator"
                className="dar-alta-type-radio"
              />
              <label htmlFor="type-creator" className="dar-alta-type-label">
                <span className="dar-alta-type-icon">🎨</span>
                <span>Creador de Contenido</span>
              </label>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="dar-alta-form-card">
          <form onSubmit={handleSubmit}>
            {/* Información Básica */}
            <div className="dar-alta-form-section">
              <h4 className="dar-alta-section-title">📋 Información Básica</h4>
              <div className="dar-alta-form-grid">
                <div className="dar-alta-form-group">
                  <label htmlFor="name-input" className="dar-alta-form-label">
                    Nombre <span className="dar-alta-required">*</span>
                  </label>
                  <input 
                    id="name-input"
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    placeholder="Nombre" 
                    required 
                    className="dar-alta-form-input"
                  />
                </div>
                <div className="dar-alta-form-group">
                  <label htmlFor="surname-input" className="dar-alta-form-label">
                    Apellido <span className="dar-alta-required">*</span>
                  </label>
                  <input 
                    id="surname-input"
                    name="surname" 
                    value={form.surname} 
                    onChange={handleChange} 
                    placeholder="Apellido" 
                    required 
                    className="dar-alta-form-input"
                  />
                </div>
                <div className="dar-alta-form-group">
                  <label htmlFor="email-input" className="dar-alta-form-label">
                    Email <span className="dar-alta-required">*</span>
                  </label>
                  <input 
                    id="email-input"
                    name="email" 
                    value={form.email} 
                    onChange={handleChange} 
                    placeholder="email@example.com" 
                    type="email" 
                    required 
                    className="dar-alta-form-input"
                  />
                </div>
                <div className="dar-alta-form-group">
                  <label htmlFor="password-input" className="dar-alta-form-label">
                    Contraseña <span className="dar-alta-required">*</span>
                  </label>
                  <div className="password-input-wrapper">
                    <input 
                      id="password-input"
                      name="password" 
                      value={form.password} 
                      onChange={handleChange} 
                      placeholder="Contraseña segura" 
                      type={showPassword ? "text" : "password"} 
                      required 
                      className="dar-alta-form-input"
                    />
                    <button 
                      type="button" 
                      onClick={handleShowPassword} 
                      className="toggle-password-btn"
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
              </div>
            </div>

            {/* Información Específica */}
            <div className="dar-alta-form-section">
              <h4 className="dar-alta-section-title">
                {type === 'admin' ? '🏢 Información del Administrador' : '🎬 Información del Creador'}
              </h4>
              <div className="dar-alta-form-grid">
                {type === 'admin' ? (
                  <div className="dar-alta-form-group">
                    <label htmlFor="department-select" className="dar-alta-form-label">
                      Departamento <span className="dar-alta-required">*</span>
                    </label>
                    <select id="department-select" name="department" value={form.department} onChange={handleChange} className="dar-alta-form-input">
                      <option value="CUSTOMER_SUPPORT">Customer Support</option>
                      <option value="DATA_ANALYTICS">Data Analytics</option>
                      <option value="MODERATION">Moderation</option>
                      <option value="HUMAN_RESOURCES">Human Resources</option>
                      <option value="LEGAL_TEAM">Legal Team</option>
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="dar-alta-form-group">
                      <label htmlFor="alias-input" className="dar-alta-form-label">
                        Alias <span className="dar-alta-required">*</span>
                      </label>
                      <input 
                        id="alias-input"
                        name="alias" 
                        value={form.alias} 
                        onChange={handleChange} 
                        placeholder="Alias único" 
                        className="dar-alta-form-input"
                      />
                      <span className="dar-alta-form-help">Este será tu identificador único en la plataforma</span>
                    </div>
                    <div className="dar-alta-form-group">
                      <label htmlFor="specialty-select" className="dar-alta-form-label">Especialidad <span className="dar-alta-required">*</span></label>
                      <select id="specialty-select" name="specialty" value={form.specialty} onChange={handleChange} className="dar-alta-form-input">
                        <option value="FICTION">Fiction</option>
                        <option value="DOCUMENTARIES">Documentaries</option>
                        <option value="SCIENCE_TECH">Science & Tech</option>
                        <option value="ART">Art</option>
                        <option value="MUSIC_CONCERTS">Music Concerts</option>
                        <option value="COMEDY">Comedy</option>
                        <option value="EDUCATIONAL">Educational</option>
                        <option value="GAMING">Gaming</option>
                        <option value="NEWS_POLITICS">News & Politics</option>
                        <option value="ANIMATION">Animation</option>
                        <option value="SPORTS">Sports</option>
                        <option value="FOODIE">Foodie</option>
                        <option value="CHILD_CONTENT">Child Content</option>
                        <option value="TUTORIALS">Tutorials</option>
                      </select>
                    </div>
                    <div className="dar-alta-form-group">
                      <label htmlFor="contentType-select" className="dar-alta-form-label">Tipo de Contenido <span className="dar-alta-required">*</span></label>
                      <select id="contentType-select" name="contentType" value={form.contentType} onChange={handleChange} className="dar-alta-form-input">
                        <option value="VIDEO">Video</option>
                        <option value="AUDIO">Audio</option>
                      </select>
                    </div>
                    <div className="dar-alta-form-group full-width">
                      <label htmlFor="description-textarea" className="dar-alta-form-label">Descripción</label>
                      <textarea 
                        id="description-textarea"
                        name="description" 
                        value={form.description} 
                        onChange={handleChange} 
                        placeholder="Descripción del creador (opcional)" 
                        className="dar-alta-form-textarea"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Photo selector */}
            <div className="dar-alta-form-section">
              <h4 className="dar-alta-section-title">📸 Foto de Perfil</h4>
              <div className="dar-alta-picture-selector">
                <div className="dar-alta-picture-options">
                  {['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png', 'avatar5.png', 
                    'avatar6.png', 'avatar7.png', 'avatar8.png', 'avatar9.png', 'avatar10.png'].map((avatar) => (
                    <div key={avatar} className="dar-alta-picture-option">
                      <input 
                        type="radio" 
                        name="picture" 
                        value={avatar} 
                        checked={form.picture === avatar} 
                        onChange={handleChange}
                        id={`pic-${avatar}`}
                        className="dar-alta-picture-radio"
                      />
                      <label htmlFor={`pic-${avatar}`} className="dar-alta-picture-label">
                        <img
                          src={`/pfp/${avatar}`}
                          alt={avatar}
                          className="dar-alta-picture-img"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="dar-alta-form-actions">
              <button type="button" onClick={() => history.push('/adminDashboard')} className="admin-btn admin-btn-secondary">
                Cancelar
              </button>
              <button type="submit" className="admin-btn admin-btn-success">
                ✓ Crear Cuenta
              </button>
            </div>
          </form>

          {/* Status Message */}
          {status && (
            <div className={getStatusClassName()}>
              {status}
            </div>
          )}

          {/* Two Factor Secret Key Display */}
          {twoFactorSecretKey && (
            <div className="dar-alta-2fa">
              <h4 className="dar-alta-2fa-title">Clave Secreta 2FA</h4>
              <div className="dar-alta-2fa-key">
                {twoFactorSecretKey}
              </div>
              <p className="dar-alta-2fa-help">
                Guarda esta clave en un lugar seguro. La necesitarás para configurar la autenticación de dos factores.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DarAltaCuenta;
