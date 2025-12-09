import React, { useState, useEffect } from 'react';
import './RegistroPage.css';
import CustomModal from '../../../components/CustomModal';
import { useModal } from '../../../utils/useModal';
import api from '../../../api/axiosConfig';
import { useHistory } from 'react-router-dom'; // Importar useHistory
import { Capacitor } from '@capacitor/core';
import { useIonRouter } from '@ionic/react';
import { validatePasswordStrength } from '../../../utils/passwordDictionary';
import { TAGS } from '../../../creator/components/constants';

function RegistroPage() {
  const { modalState, closeModal, showSuccess, showError, showInfo } = useModal();
  const imagenes = [
    '/pfp/avatar1.png',
    '/pfp/avatar2.png',
    '/pfp/avatar3.png',
    '/pfp/avatar4.png',
    '/pfp/avatar5.png',
    '/pfp/avatar6.png',
    '/pfp/avatar7.png',
    '/pfp/avatar8.png',
    '/pfp/avatar9.png',
    '/pfp/avatar10.png'
  ];

  const [form, setForm] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    repetirPassword: '',
    alias: '',
    dateOfBirth: '',
    vip: false,
    vip: false,
    picture: imagenes[0],
    preferences: []
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [repeatError, setRepeatError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [showAvatars, setShowAvatars] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [message, setMessage] = useState('');
  const history = useHistory(); // Hook para redirección
  const isMobile = Capacitor.isNativePlatform();

  // Intentar obtener ionRouter para móvil
  let ionRouter = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ionRouter = useIonRouter();
  } catch (e) { }

  // Navegación híbrida
  const navigate = (path, state = null) => {
    if (isMobile && ionRouter) {
      if (state) {
        sessionStorage.setItem('navigationState', JSON.stringify(state));
      }
      ionRouter.push(path, 'forward', 'push');
    } else {
      if (state) {
        history.push({ pathname: path, state });
      } else {
        history.push(path);
      }
    }
  };

  // Asegurar que el scroll comience desde arriba
  useEffect(() => {
    const formElement = document.querySelector('.form-panel form');
    if (formElement) {
      formElement.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'name' && value.length > 12) return;
    if (name === 'password') {
      setPasswordMsg(getPasswordMsg(value));
    }
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getPasswordMsg = (value) => {
    const errors = validatePasswordStrength(value);

    if (errors.length === 0) {
      return 'Contraseña segura.';
    }

    return errors[0]; // Mostrar el primer error
  };

  const handleVIPChange = (e) => {
    handleChange(e);
    if (e.target.checked) {
      showInfo('¡Has seleccionado la opción VIP!\nAhora podrás acceder a las siguientes ventajas: contenido exclusivo, soporte prioritario y mucho más.\n¡Disfruta de tu experiencia VIP!', 'Bienvenido a VIP');
    }
  };

  const handleTagsChange = (e) => {
    const values = Array.from(e.target.selectedOptions, o => o.value);
    setForm(prev => ({ ...prev, preferences: values }));
  };

  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleShowRepeatPassword = () => {
    setShowRepeatPassword((prev) => !prev);
  };

  // Helpers extraídos para reducir complejidad de handleSubmit
  const validatePasswordMatch = () =>
    form.password === form.repetirPassword ? null : 'Las contraseñas no coinciden';

  const validateCompositeStrength = () => {
    const errors = validatePasswordStrength(
      form.password,
      form.email,
      form.name,
      form.surname,
      form.alias
    );
    return errors.length > 0 ? errors[0] : null;
  };

  const validateBasicStrength = () => {
    const errors = validatePasswordStrength(form.password);
    return errors.length > 0 ? errors.join('\n') : null;
  };

  const validateAge = () => {
    if (!form.dateOfBirth) return null;
    const dateOfBirth = new Date(form.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const m = today.getMonth() - dateOfBirth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) age--;
    return age <= 4 ? 'La edad debe ser mayor a 4 años.' : null;
  };

  const resetMessages = () => {
    setRepeatError('');
    setAgeError('');
    setMessage('');
  };

  const buildUserObject = () => ({
    name: form.name.trim(),
    surname: form.surname.trim(),
    email: form.email.trim(),
    password: form.password,
    alias: form.alias.trim() || null,
    dateOfBirth: form.dateOfBirth || null,
    vip: form.vip || false,
    picture: form.picture || null,
    preferences: form.preferences || [],
    isActive: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const matchError = validatePasswordMatch();
    if (matchError) { setRepeatError(matchError); showError(matchError); return; }

    const compositeError = validateCompositeStrength();
    if (compositeError) { setPasswordMsg(compositeError); showError(compositeError); return; }

    resetMessages();

    const strengthError = validateBasicStrength();
    if (strengthError) { setMessage(strengthError); return; }

    const ageErr = validateAge();
    if (ageErr) { setAgeError(ageErr); return; }

    const user = buildUserObject();

    try {
      const response = await api.post('/api/users', user);

      if (response.status === 201 || response.status === 200) {
        navigate('/setup-2fa', { email: form.email });
      } else {
        const errorData = response.data;
        console.error('Error del servidor:', errorData);
        showError(errorData.error || 'Error al crear usuario. Por favor, verifica los datos e intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      const errorData = error.response?.data || { error: 'Error desconocido' };
      showError(errorData.error || errorData.message || 'Error de conexión con el servidor. Por favor, intenta más tarde.');
    }
  };

  return (
    <div className="page-container">
      <div className="animated-bg"></div>

      <div className="registro-wrapper">
        {/* Panel lateral informativo */}
        <div className="info-panel">
          <div className="info-content">
            <h2 className="info-title">¡Únete a ESIMEDIA!</h2>
            <p className="info-description">
              Descubre contenido exclusivo, accede a funciones premium y forma parte de nuestra comunidad.
            </p>
            <div className="info-features">
              <div className="feature-item">
                <span className="feature-icon">🎬</span>
                <span className="feature-text">Contenido exclusivo</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⭐</span>
                <span className="feature-text">Acceso VIP disponible</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <span className="feature-text">Totalmente seguro</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel del formulario */}
        <div className="form-panel">
          <h2 className="page-title">
            <span className="highlight">Crear Cuenta</span>
          </h2>

          <form onSubmit={handleSubmit}>

            {/* Sección: Datos Personales */}
            <div className="form-section">
              <h3 className="section-title">Datos Personales</h3>

              <div className="form-grid">
                <div className="form-field">
                  <label htmlFor="registro-name" className="form-label required">Nombre</label>
                  <input
                    id="registro-name"
                    type="text"
                    name="name"
                    placeholder="Nombre"
                    required
                    value={form.name}
                    onChange={handleChange}
                    maxLength={12}
                    className="form-input"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="registro-surname" className="form-label required">Apellidos</label>
                  <input
                    id="registro-surname"
                    type="text"
                    name="surname"
                    placeholder="Apellidos"
                    required
                    value={form.surname}
                    onChange={handleChange}
                    maxLength={12}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="registro-email" className="form-label required">Email</label>
                <input
                  id="registro-email"
                  type="email"
                  name="email"
                  placeholder="Email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="registro-alias" className="form-label">Alias (opcional)</label>
                <input
                  id="registro-alias"
                  type="text"
                  name="alias"
                  placeholder="Alias"
                  value={form.alias}
                  onChange={handleChange}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label htmlFor="registro-dateOfBirth" className="form-label required">Fecha de nacimiento</label>
                <input
                  id="registro-dateOfBirth"
                  type="date"
                  name="dateOfBirth"
                  required
                  value={form.dateOfBirth}
                  onChange={handleChange}
                  className="form-input"
                />
                {ageError && <div className="validation-message error">{ageError}</div>}
              </div>
            </div>

            {/* Sección: Seguridad */}
            <div className="form-section">
              <h3 className="section-title">Seguridad</h3>

              <div className="form-field">
                <label htmlFor="registro-password" className="form-label required">Contraseña</label>
                <div className="password-input-wrapper">
                  <input
                    id="registro-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Contraseña"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="form-input"
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
                {form.password && (
                  <div className={`validation-message ${passwordMsg === 'Contraseña segura.' ? 'success' : 'error'}`}>
                    {passwordMsg}
                  </div>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="registro-repeatPassword" className="form-label required">Repetir contraseña</label>
                <div className="password-input-wrapper">
                  <input
                    id="registro-repeatPassword"
                    type={showRepeatPassword ? "text" : "password"}
                    name="repetirPassword"
                    placeholder="Repetir contraseña"
                    required
                    value={form.repetirPassword}
                    onChange={handleChange}
                    className="form-input"
                  />
                  <button
                    type="button"
                    onClick={handleShowRepeatPassword}
                    className="toggle-password-btn"
                    aria-label={showRepeatPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showRepeatPassword ? (
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
                {repeatError && <div className="validation-message error">{repeatError}</div>}
              </div>
            </div>

            {/* Sección: Personalización */}
            <div className="form-section">
              <h3 className="section-title">Personalización</h3>

              <div className="form-field">
                <label className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    name="vip"
                    checked={form.vip}
                    onChange={handleVIPChange}
                    className="checkbox-input"
                  />
                  <span className="checkbox-label">¿Quieres una cuenta VIP?</span>
                </label>
              </div>

              <div className="form-field">
                <label htmlFor="registro-tags" className="form-label">Mis Gustos (Tags)</label>
                <select
                  id="registro-tags"
                  name="preferences"
                  multiple
                  value={form.preferences}
                  onChange={handleTagsChange}
                  className="form-input"
                  style={{ height: 'auto', minHeight: '100px' }}
                >
                  {TAGS.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                <small className="help-text">Mantén Ctrl (Windows) o Cmd (Mac) para seleccionar varios.</small>
              </div>

              <div className="form-field avatar-selector">
                <label className="form-label" htmlFor="avatar-toggle-btn">Foto de perfil</label>
                <button
                  id="avatar-toggle-btn"
                  type="button"
                  onClick={() => setShowAvatars((prev) => !prev)}
                  className="avatar-toggle-btn"
                >
                  {showAvatars ? 'Ocultar selección' : 'Elegir foto de perfil'}
                </button>
                {showAvatars && (
                  <div className="avatar-grid">
                    {imagenes.map((img, idx) => (
                      <label key={img} className="avatar-option">
                        <input
                          type="radio"
                          name="picture"
                          value={img}
                          checked={form.picture === img}
                          onChange={handleChange}
                          className="avatar-radio"
                        />
                        <img
                          src={img}
                          alt={`avatar${idx + 1}`}
                          className="avatar-img"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Registrarse
            </button>
          </form>
        </div>
      </div>

      {/* Modal personalizado */}
      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
      />
    </div>
  );
}

export default RegistroPage;
