import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logo from '../resources/esimedialogo.png';
import './ProfilePage.css';
import CustomModal from '../components/CustomModal';
import { useModal } from '../utils/useModal';
import { handleLogout as logoutCsrf } from '../auth/logout';

// Componente para el menú de usuario
const UserMenu = ({ showUserMenu, setShowUserMenu, handleLogout }) => (
  showUserMenu && (
    <div className="user-dropdown-profile">
      <Link to="/creator/profile" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
        <i className="fas fa-user-circle"></i> Mi Perfil
      </Link>
      <Link to="/creator/profile?edit=1" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
        <i className="fas fa-user-edit"></i> Editar Perfil
      </Link>
      <div className="dropdown-divider"></div>
      <button onClick={handleLogout} className="dropdown-item logout-btn">
        <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
      </button>
    </div>
  )
);

// Componente para el selector de avatar
const AvatarSelector = ({ showAvatarSelector, availableAvatars, previewImage, tempData, handleAvatarSelect }) => (
  showAvatarSelector && (
    <div className="avatar-selector">
      <p className="avatar-selector-title">Selecciona tu avatar:</p>
      <div className="avatar-grid">
        {availableAvatars.map((avatar, index) => (
          <div
            key={index}
            className={`avatar-option ${(previewImage || tempData.picture) === avatar ? 'selected' : ''}`}
            onClick={() => handleAvatarSelect(avatar)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAvatarSelect(avatar);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Seleccionar avatar ${index + 1}`}
          >
            <img src={avatar} alt={`Avatar ${index + 1}`} />
          </div>
        ))}
      </div>
    </div>
  )
);

// Componente para la foto de perfil
const ProfilePhoto = ({ previewImage, profileData, isEditing, showAvatarSelector, setShowAvatarSelector, availableAvatars, tempData, handleAvatarSelect }) => (
  <div className="profile-photo-section">
    <div className="photo-container">
      {previewImage || profileData.picture ? (
        <img 
          src={previewImage || profileData.picture} 
          alt="Foto de perfil" 
          className="profile-photo"
        />
      ) : (
        <div className="photo-placeholder">
          <span>👤</span>
        </div>
      )}
    </div>
    {isEditing && (
      <div className="photo-upload">
        <button 
          type="button"
          className="upload-button"
          onClick={() => setShowAvatarSelector(!showAvatarSelector)}
        >
          {showAvatarSelector ? 'Cerrar selector' : 'Cambiar foto'}
        </button>
        <AvatarSelector 
          showAvatarSelector={showAvatarSelector}
          availableAvatars={availableAvatars}
          previewImage={previewImage}
          tempData={tempData}
          handleAvatarSelect={handleAvatarSelect}
        />
      </div>
    )}
  </div>
);

// Componente para un campo de formulario
const FormField = ({ label, name, value, isEditing, onChange, readonly = false, type = 'text', maxLength, placeholder, pattern }) => (
  <div className="form-row">
    <label>{label}</label>
    {isEditing && !readonly ? (
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        pattern={pattern}
      />
    ) : (
      <div className={`field-value ${readonly ? 'readonly' : ''}`}>{value || 'No especificado'}</div>
    )}
  </div>
);

// Componente para el campo de descripción
const DescriptionField = ({ isEditing, tempData, profileData, handleInputChange }) => (
  <div className="form-row">
    <label htmlFor="description">Descripción</label>
    {isEditing ? (
      <textarea
        id="description"
        name="description"
        value={tempData.description || ''}
        onChange={handleInputChange}
        placeholder="Describe tu perfil de creador (máx. 400 caracteres)"
        maxLength={400}
        rows={4}
        style={{
          width: '100%',
          padding: '16px 20px',
          background: '#000000',
          border: '1px solid rgba(79, 86, 186, 0.3)',
          borderRadius: '12px',
          color: '#F5F6F3',
          fontSize: '16px',
          fontFamily: 'inherit',
          resize: 'vertical'
        }}
      />
    ) : (
      <div className="field-value">{profileData.description || 'Sin descripción'}</div>
    )}
  </div>
);



function CreatorProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { modalState, closeModal, showSuccess, showError, showWarning } = useModal();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const availableAvatars = [
    '/pfp/avatar1.png',
    '/pfp/avatar2.png',
    '/pfp/avatar3.png',
    '/pfp/avatar4.png',
    '/pfp/avatar5.png',
    '/pfp/avatar6.png',
    '/pfp/avatar7.png',
    '/pfp/avatar8.png',
    '/pfp/avatar9.png',
    '/pfp/avatar10.png',
  ];

  // Estado inicial vacío
  const [profileData, setProfileData] = useState({
    name: '',
    surname: '',
    email: '',
    alias: '',
    description: '',
    specialty: '',
    contentType: '',
    picture: '',
    createdAt: ''
  });

  const [tempData, setTempData] = useState({ ...profileData });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('edit') === '1') {
      setIsEditing(true);
    }
  }, [location]);

  const getProfileFromBackend = async () => {
    try {
      const sessionRes = await fetch('/api/auth/validate-token', { credentials: 'include' });
      if (!sessionRes.ok) return null;
      const session = await sessionRes.json();
      const email = session?.email;
      if (!email) return null;

      const res = await fetch(`/api/creators/profile?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        console.error('Error al obtener el perfil:', res.status, res.statusText);
        return null;
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Error al realizar la solicitud:', error);
      return null;
    }
  };

  const getInitialProfileData = async () => {
    setLoading(true);
    try {
      const data = await getProfileFromBackend();
      if (data) {
        setProfileData(data);
        setTempData(data);
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    getInitialProfileData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setTempData({...profileData});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setTempData({...profileData});
    setPreviewImage(null);
    // Si venía de ?edit=1, quitar el parámetro
    navigate('/creator/profile', { replace: true });
  };

  const handleSave = async () => {
    try {
      const sessionRes = await fetch('/api/auth/validate-token', { credentials: 'include' });
      if (!sessionRes.ok) {
        showWarning('No estás autenticado. Por favor, inicia sesión.');
        return;
      }
      const session = await sessionRes.json();
      const email = session?.email;
      if (!email) {
        showWarning('Sesión inválida. Inicia sesión.');
        return;
      }

      const response = await fetch(`/api/creators/profile?email=${encodeURIComponent(email)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tempData.name,
          surname: tempData.surname,
          alias: tempData.alias,
          description: tempData.description,
          picture: tempData.picture
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
      navigate('/creator/profile', { replace: true });
    } catch (error) {
      console.error('Error al guardar los cambios:', error);
      showError('Ocurrió un error al guardar los cambios. Inténtalo de nuevo.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTempData({
      ...tempData,
      [name]: value
    });
  };

  const handleAvatarSelect = (avatarPath) => {
    setPreviewImage(avatarPath);
    setTempData({
      ...tempData,
      picture: avatarPath
    });
    setShowAvatarSelector(false);
  };

  const handleLogout = () => logoutCsrf('/login', navigate);

  if (loading) {
    return (
      <div className="creator-profile-page">
        <div className="animated-bg"></div>
        <div className="profile-container">
          <div className="profile-box">
            <div style={{ color: '#F5F6F3', textAlign: 'center', padding: '40px' }}>
              Cargando perfil...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="creator-profile-page">
      {/* Animated Background */}
      <div className="animated-bg"></div>
      
      {/* Header */}
      <header className={`profile-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          <div className="header-left">
            <button 
              onClick={() => navigate('/creator')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              aria-label="Ir al panel de creador"
            >
              <img 
                src={logo} 
                className="logo-profile" 
                alt="ESIMEDIA" 
              />
            </button>
          </div>
          
          <nav className="nav-links-profile">
            <Link to="/creator">Panel</Link>
            <Link to="/creator/profile">Mi Perfil</Link>
          </nav>
          
          <div className="header-right">
            <div className="user-menu-container">
              <div 
                className="user-avatar-profile"
                onClick={() => setShowUserMenu(!showUserMenu)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowUserMenu(!showUserMenu);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Menú de usuario"
                aria-expanded={showUserMenu}
              >
                {profileData.picture ? (
                  <img 
                    src={profileData.picture} 
                    alt="Avatar" 
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <i className="fas fa-user"></i>
                )}
              </div>
              
              <UserMenu 
                showUserMenu={showUserMenu}
                setShowUserMenu={setShowUserMenu}
                handleLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>
      
      <div className="profile-container">
        <div className="profile-box">
          <h1>Mi Perfil de Creador</h1>
          
          <ProfilePhoto 
            previewImage={previewImage}
            profileData={profileData}
            isEditing={isEditing}
            showAvatarSelector={showAvatarSelector}
            setShowAvatarSelector={setShowAvatarSelector}
            availableAvatars={availableAvatars}
            tempData={tempData}
            handleAvatarSelect={handleAvatarSelect}
          />

          <div className="profile-form">
            <FormField 
              label="Nombre *"
              name="name"
              value={isEditing ? tempData.name : profileData.name}
              isEditing={isEditing}
              onChange={handleInputChange}
              placeholder="Ingresa tu nombre"
              maxLength={15}
            />

            <FormField 
              label="Apellidos *"
              name="surname"
              value={isEditing ? tempData.surname : profileData.surname}
              isEditing={isEditing}
              onChange={handleInputChange}
              placeholder="Ingresa tus apellidos"
              maxLength={15}
            />

            <FormField 
              label="Email"
              name="email"
              value={profileData.email}
              isEditing={false}
              readonly={true}
            />

            <FormField 
              label="Alias *"
              name="alias"
              value={isEditing ? tempData.alias : profileData.alias}
              isEditing={isEditing}
              onChange={handleInputChange}
              placeholder="Ingresa tu alias (solo letras y números)"
              maxLength={12}
              pattern="[A-Za-z0-9]+"
            />

            <FormField 
              label="Especialidad"
              name="specialty"
              value={profileData.specialty}
              isEditing={false}
              readonly={true}
            />

            <FormField 
              label="Tipo de Contenido"
              name="contentType"
              value={profileData.contentType}
              isEditing={false}
              readonly={true}
            />

            <DescriptionField 
              isEditing={isEditing}
              tempData={tempData}
              profileData={profileData}
              handleInputChange={handleInputChange}
            />

            <FormField 
              label="Fecha de Creación"
              name="createdAt"
              value={profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString('es-ES') : 'No especificada'}
              isEditing={false}
              readonly={true}
            />

            <div className="form-row">
              <label htmlFor="3fa-status">Autenticación de Tercer Factor (3FA)</label>
              <div id="3fa-status" className="field-value readonly">✓ Activado (siempre activo para creadores)</div>
            </div>
          </div>

          <div className="profile-actions">
            {!isEditing ? (
              <button className="btn-edit" onClick={handleEdit}>
                Editar Perfil
              </button>
            ) : (
              <>
                <button className="btn-save" onClick={handleSave}>
                  Guardar Cambios
                </button>
                <button className="btn-cancel" onClick={handleCancel}>
                  Cancelar
                </button>
              </>
            )}
          </div>
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

export default CreatorProfilePage;
