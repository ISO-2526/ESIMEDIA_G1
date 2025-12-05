import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../../resources/esimedialogo.png';
import './UserProfilePage.css';
import CustomModal from '../../../components/CustomModal';
import { useModal } from '../../../utils/useModal';
import { handleLogout as logoutWithCookies } from '../../../auth/logout';
import { TAGS } from '../../../creator/components/constants';
import NotificationBell from '../../../components/NotificationBell/NotificationBell';

const isActivationKey = (key) => key === 'Enter' || key === ' ' || key === 'Spacebar';

const handleKeyboardActivation = (event, callback) => {
  if (isActivationKey(event.key)) {
    event.preventDefault();
    callback();
  }
};

// Componente extraído para el selector de avatares
const AvatarSelector = ({ showAvatarSelector, previewImage, tempData, availableAvatars, onAvatarSelect }) => {
  if (!showAvatarSelector) return null;
  return (
    <div className="avatar-selector">
      <p className="avatar-selector-title">Selecciona tu avatar:</p>
      <div className="avatar-grid">
        {availableAvatars.map((avatar, index) => (
          <div
            key={index}
            className={`avatar-option ${(previewImage || tempData.picture) === avatar ? 'selected' : ''}`}
            onClick={() => onAvatarSelect(avatar)}
            onKeyDown={(event) => handleKeyboardActivation(event, () => onAvatarSelect(avatar))}
            role="button"
            tabIndex={0}
            aria-label={`Seleccionar avatar ${index + 1}`}
          >
            <img src={avatar} alt={`Avatar ${index + 1}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper: obtiene sesión desde cookie (email, role)
const getSession = async () => {
  try {
    const r = await fetch('/api/auth/validate-token', { method: 'GET', credentials: 'include' });
    if (!r.ok) return null;
    const data = await r.json();
    return { email: data?.email ?? data?.data?.email, role: data?.role ?? data?.data?.role };
  } catch { return null; }
};

// Helper function for fetching 3FA status
const fetch3FAStatus = async (setThirdFactorEnabled) => {
  try {
    const response = await fetch('/api/users/profile', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
      const data = await response.json();
      setThirdFactorEnabled(data.thirdFactorEnabled);
    }
  } catch (error) {
    console.error('Error al obtener el estado del 3FA:', error);
  }
};

// Helper function for rendering form fields
const renderFormField = (label, name, value, isEditing, tempValue, handleInputChange, isReadonly = false) => (
  <div className="form-row">
    <label htmlFor={`profile-${name}`}>{label}</label>
    {isEditing && !isReadonly ? (
      <input
        id={`profile-${name}`}
        type="text"
        name={name}
        value={tempValue}
        onChange={handleInputChange}
        placeholder={`Ingresa tu ${label.toLowerCase()}`}
      />
    ) : (
      <div className={`field-value ${isReadonly ? 'readonly' : ''}`}>
        {name === 'dateOfBirth'
          ? (value ? new Date(value).toLocaleDateString('es-ES') : '')
          : value}
      </div>
    )}
  </div>
);

/* ---------- Helpers añadidos para reducir complejidad ---------- */
const getProfileFromBackend = async () => {
  try {
    const res = await fetch('/api/users/profile', {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) {
      console.error('Error al obtener el perfil:', res.status, res.statusText);
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error('Error al realizar la solicitud:', error);
    return null;
  }
};

const parseActivationResponseMessage = async (response) => {
  let message = '';
  const ct = (response.headers.get('content-type') || '').toLowerCase();
  try {
    if (ct.includes('application/json')) {
      const data = await response.json();
      message = typeof data === 'string' ? data : (data?.message || '');
    } else {
      message = await response.text();
    }
  } catch {
    // Ignorar parse errores
  }
  return message;
};

const activateOrDeactivate3FA = async ({ email, activate }) => {
  return fetch('/api/auth/activate-3fa', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, activate })
  });
};

/* ---------- Subcomponentes para reducir JSX dentro de UserProfilePage ---------- */
const ProfileHeader = ({ scrolled, picture, vip, onToggleMenu, showUserMenu, logout, userId }) => (
  <header className={`profile-header ${scrolled ? 'scrolled' : ''}`}>
    <div className="header-container">
      <div className="header-left">
        <button
          onClick={() => window.location.href = '/usuario'}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          aria-label="Ir a inicio"
        >
          <img src={logo} className="logo-profile" alt="ESIMEDIA" />
        </button>
      </div>
      <nav className="nav-links-profile">
        <Link to="/usuario">Inicio</Link>
        <Link to="/perfil">Mi Perfil</Link>
        <Link to="/suscripcion">Suscripción</Link>
      </nav>
      <div className="header-right">
        {userId && <NotificationBell userId={userId} />}
        <div className="user-menu-container">
          <div
            className="user-avatar-profile"
            onClick={onToggleMenu}
            onKeyDown={(event) => handleKeyboardActivation(event, onToggleMenu)}
            role="button"
            tabIndex={0}
            aria-label="Menú de usuario"
          >
            {picture ? (
              <img
                src={picture}
                alt="Avatar"
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : <i className="fas fa-user"></i>}
            {vip && (
              <div style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(255, 193, 7, 0.6)',
                border: '2px solid #1a1a2e',
                zIndex: 9999
              }}>
                <i className="fas fa-crown" style={{ color: '#1a1a2e', fontSize: '12px' }}></i>
              </div>
            )}
          </div>
          {showUserMenu && (
            <div className="user-dropdown-profile">
              <Link to="/perfil" className="dropdown-item" onClick={onToggleMenu}>
                <i className="fas fa-user-circle"></i> Mi Perfil
              </Link>
              <Link to="/playlists" className="dropdown-item" onClick={onToggleMenu}>
                <i className="fas fa-list"></i> Mis Listas
              </Link>
              <Link to="/suscripcion" className="dropdown-item" onClick={onToggleMenu}>
                <i className="fas fa-credit-card"></i> Suscripción
              </Link>
              <div className="dropdown-divider"></div>
              <button onClick={logout} className="dropdown-item logout-btn">
                <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
);

const ProfilePhotoSection = ({
  isEditing,
  previewImage,
  profilePicture,
  showAvatarSelector,
  onToggleSelector,
  availableAvatars,
  tempData,
  handleAvatarSelect
}) => (
  <div className="profile-photo-section">
    <div className="photo-container">
      {previewImage || profilePicture ? (
        <img
          src={previewImage || profilePicture}
          alt="Foto de perfil"
          className="profile-photo"
        />
      ) : (
        <div className="photo-placeholder"><span>👤</span></div>
      )}
    </div>
    {isEditing && (
      <div className="photo-upload">
        <button
          type="button"
          className="upload-button"
          onClick={onToggleSelector}
        >
          {showAvatarSelector ? 'Cerrar selector' : 'Cambiar foto'}
        </button>
        <AvatarSelector
          showAvatarSelector={showAvatarSelector}
          previewImage={previewImage}
          tempData={tempData}
          availableAvatars={availableAvatars}
          onAvatarSelect={handleAvatarSelect}
        />
      </div>
    )}
  </div>
);

const THIRD_FACTOR_TOGGLE_ID = 'third-factor-toggle';

const Security3FASection = ({
  isEditing,
  thirdFactorEnabled,
  statusMessage,
  handleToggle3FA
}) => (
  <div className="form-row security-row">
    <div className="security-header">
      <label className="security-label" htmlFor={THIRD_FACTOR_TOGGLE_ID}>
        <span className="security-icon">🔐</span>
        Autenticación de Tercer Factor (3FA)
      </label>
      <p className="security-description">
        Añade una capa extra de seguridad con verificación por correo electrónico
      </p>
    </div>
    <div className="third-factor-section">
      {isEditing ? (
        <>
          <div className="toggle-container">
            <label className="toggle-switch" htmlFor={THIRD_FACTOR_TOGGLE_ID}>
              <input
                id={THIRD_FACTOR_TOGGLE_ID}
                type="checkbox"
                className="toggle-input"
                checked={thirdFactorEnabled}
                onChange={handleToggle3FA}
              />
              <span className="toggle-slider"></span>
            </label>
            <span className={`toggle-status ${thirdFactorEnabled ? 'active' : 'inactive'}`}>
              {thirdFactorEnabled ? 'Activado' : 'Desactivado'}
            </span>
          </div>
          {statusMessage && <p className="status-message">{statusMessage}</p>}
        </>
      ) : (
        <div className={`field-value security-status ${thirdFactorEnabled ? 'active' : 'inactive'}`}>
          <span className="status-icon">{thirdFactorEnabled ? '✓' : '✗'}</span>
          {thirdFactorEnabled ? 'Activado' : 'Desactivado'}
        </div>
      )}
    </div>
  </div>
);

const ProfileActions = ({ isEditing, onEdit, onDelete, onSave, onCancel }) => (
  <div className="profile-actions">
    {!isEditing ? (
      <>
        <button className="btn-edit" onClick={onEdit}>Editar Perfil</button>
        <button className="btn-delete-account" onClick={onDelete}>Eliminar Cuenta</button>
      </>
    ) : (
      <>
        <button className="btn-save" onClick={onSave}>Guardar Cambios</button>
        <button className="btn-cancel" onClick={onCancel}>Cancelar</button>
      </>
    )}
  </div>
);



/* ---------- Refactor de UserProfilePage (reducción complejidad) ---------- */
function UserProfilePage() {
  const navigate = useNavigate();
  const { modalState, closeModal, showSuccess, showError } = useModal();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [thirdFactorEnabled, setThirdFactorEnabled] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [userProfile, setUserProfile] = useState({ id: null, vip: false });

  const availableAvatars = [
    '/pfp/avatar1.png', '/pfp/avatar2.png', '/pfp/avatar3.png', '/pfp/avatar4.png', '/pfp/avatar5.png',
    '/pfp/avatar6.png', '/pfp/avatar7.png', '/pfp/avatar8.png', '/pfp/avatar9.png', '/pfp/avatar10.png'
  ];

  const [profileData, setProfileData] = useState({
    id: null, name: '', surname: '', email: '', alias: '', dateOfBirth: '', picture: '', preferences: []
  });
  const [tempData, setTempData] = useState({ ...profileData });
  const [previewImage, setPreviewImage] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    (async () => {
      const data = await getProfileFromBackend();
      if (data) {
        setProfileData(data);
        setTempData(data);
        setUserProfile({ id: data.email, vip: data.vip || false });
      }
    })();
  }, []);

  useEffect(() => {
    fetch3FAStatus(setThirdFactorEnabled);
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setTempData({ ...profileData });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempData({ ...profileData });
    setPreviewImage(null);
    setStatusMessage('');
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/users/editUser`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tempData.name,
          surname: tempData.surname,
          alias: tempData.alias,
          dateOfBirth: tempData.dateOfBirth,
          picture: tempData.picture,
          preferences: tempData.preferences
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        showError(`Error al guardar los cambios: ${errorText}`);
        return;
      }
      const updatedData = await response.json();
      setProfileData(updatedData);
      setIsEditing(false);
      showSuccess('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      showError('Ocurrió un error al guardar los cambios. Inténtalo de nuevo.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagsChange = (e) => {
    const values = Array.from(e.target.selectedOptions, o => o.value);
    setTempData(prev => ({ ...prev, preferences: values }));
  };

  const handleAvatarSelect = (avatarPath) => {
    setPreviewImage(avatarPath);
    setTempData(prev => ({ ...prev, picture: avatarPath }));
    setShowAvatarSelector(false);
  };

  const handleDeleteAccount = async () => {
    try {
      const session = await getSession();
      const email = session?.email;
      if (!email) {
        showError('Sesión inválida.');
        return;
      }

      const res = await fetch(`/api/users/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        let txt = '';
        try { txt = await res.text(); } catch { }
        showError(txt || 'Error al eliminar cuenta');
        return;
      }

      showSuccess('Cuenta eliminada. Redirigiendo...');
      setTimeout(() => logoutWithCookies('/', navigate), 1500);
    } catch (e) {
      console.error(e);
      showError('Error de red. Intenta de nuevo.');
    }
  };

  /* ---------- Refactor de handleToggle3FA (reducción complejidad) ---------- */
  const handleToggle3FA = async () => {
    try {
      const session = await getSession();
      const email = session?.email;
      if (!email) return;

      const nextState = !thirdFactorEnabled;
      const response = await activateOrDeactivate3FA({ email, activate: nextState });

      if (!response.ok) {
        let errText = '';
        try { errText = await response.text(); } catch { }
        showError(errText || 'No se pudo cambiar el estado del 3FA');
        setStatusMessage(errText || 'No se pudo cambiar el estado del 3FA');
        return;
      }

      const message = await parseActivationResponseMessage(response);
      setThirdFactorEnabled(nextState);
      const fallback = nextState
        ? 'Tercer factor activado correctamente.'
        : 'Tercer factor desactivado correctamente.';
      const finalMsg = message || fallback;
      setStatusMessage(finalMsg);
      showSuccess(finalMsg);
    } catch (error) {
      console.error('Error al cambiar el estado del 3FA:', error);
      setStatusMessage('Error al cambiar el estado del 3FA.');
      showError('Error al cambiar el estado del 3FA.');
    }
  };

  return (
    <div className="user-profile-page">
      <div className="animated-bg"></div>

      <ProfileHeader
        scrolled={scrolled}
        picture={profileData.picture}
        vip={userProfile.vip}
        onToggleMenu={() => setShowUserMenu(s => !s)}
        showUserMenu={showUserMenu}
        logout={() => logoutWithCookies('/login', navigate)}
        userId={profileData.id}
      />

      <div className="profile-container">
        <div className="profile-box">
          <h1>Mi Perfil</h1>

          <ProfilePhotoSection
            isEditing={isEditing}
            previewImage={previewImage}
            profilePicture={profileData.picture}
            showAvatarSelector={showAvatarSelector}
            onToggleSelector={() => setShowAvatarSelector(s => !s)}
            availableAvatars={availableAvatars}
            tempData={tempData}
            handleAvatarSelect={handleAvatarSelect}
          />

          <div className="profile-form">
            {renderFormField('Nombre *', 'name', profileData.name, isEditing, tempData.name, handleInputChange)}
            {renderFormField('Apellidos *', 'surname', profileData.surname, isEditing, tempData.surname, handleInputChange)}
            {renderFormField('Email', 'email', profileData.email, false, '', handleInputChange, true)}
            {renderFormField('Alias *', 'alias', profileData.alias, isEditing, tempData.alias, handleInputChange)}
            {renderFormField('Fecha de Nacimiento', 'dateOfBirth', profileData.dateOfBirth, false, '', handleInputChange, true)}

            <div className="form-row">
              <label>Mis Gustos (Tags)</label>
              {isEditing ? (
                <>
                  <select
                    multiple
                    value={tempData.preferences || []}
                    onChange={handleTagsChange}
                    style={{ width: '100%', padding: '8px', minHeight: '100px', borderRadius: '4px', border: '1px solid #ccc' }}
                  >
                    {TAGS.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                  <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>Mantén Ctrl (Windows) o Cmd (Mac) para seleccionar varios.</small>
                </>
              ) : (
                <div className="field-value">
                  {profileData.preferences && profileData.preferences.length > 0
                    ? profileData.preferences.join(', ')
                    : 'Sin preferencias definidas'}
                </div>
              )}
            </div>

            <Security3FASection
              isEditing={isEditing}
              thirdFactorEnabled={thirdFactorEnabled}
              statusMessage={statusMessage}
              handleToggle3FA={handleToggle3FA}
            />
          </div>

          <ProfileActions
            isEditing={isEditing}
            onEdit={handleEdit}
            onDelete={handleDeleteAccount}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </div>

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

export default UserProfilePage;
