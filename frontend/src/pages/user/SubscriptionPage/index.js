import React, { useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import MobileHeader from '../../../components/mobile/MobileHeader';
import logo from '../../../resources/esimedialogo.png';
import './SubscriptionPage.css';
import { handleLogout as logoutCsrf } from '../../../auth/logout';
import CustomModal from '../../../components/CustomModal';
import { useModal } from '../../../utils/useModal';
import axios from '../../../api/axiosConfig'; // ✅ Usar axios con CapacitorHttp

function SubscriptionPage() {
  const history = useHistory();
  const { modalState: notificationModal, closeModal: closeNotificationModal, showSuccess } = useModal();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalAction, setModalAction] = useState(''); // 'upgrade' o 'downgrade'
  const [scrolled, setScrolled] = useState(false);
  const [userProfile, setUserProfile] = useState({
    picture: '/pfp/avatar1.png',
    vip: false
  });

  // Función para obtener URL absoluta en Android
  const getImageUrl = (path) => {
    if (!path) return '/pfp/avatar1.png';
    if (path.startsWith('http')) return path;
    if (Capacitor.isNativePlatform()) {
      return `http://10.0.2.2:8080${path}`;
    }
    return path;
  };
  
  // Datos de suscripción del usuario (simulados)
  const [subscriptionData, setSubscriptionData] = useState({
    tipo: 'VIP', // 'VIP' o 'NORMAL'
    fechaInicioVIP: '2024-01-15', // Fecha desde cuando es VIP
    beneficios: [
      'Acceso a contenido exclusivo'
    ]
  });

  const handleLogout = async () => {
    await logoutCsrf(history, '/');
  };
  
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    loadUserProfile();
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const response = await axios.get('/api/users/profile', {
        withCredentials: true
      });
      const profileData = response.data;
      setSubscriptionData({
        tipo: profileData.vip ? 'VIP' : 'NORMAL',
        fechaInicioVIP: profileData.vipSince ? new Date(profileData.vipSince).toISOString().split('T')[0] : null,
        beneficios: profileData.vip ? ['Acceso a contenido exclusivo'] : []
      });
    } catch (error) {
      console.error('Error al cargar datos de suscripción:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile', {
        withCredentials: true
      });
      const profileData = response.data;
      const updatedProfile = {
        name: profileData.name,
        surname: profileData.surname,
        email: profileData.email,
        alias: profileData.alias,
        dateOfBirth: profileData.dateOfBirth,
        picture: getImageUrl(profileData.picture),
        vip: profileData.vip || false
      };
      setUserProfile(updatedProfile);
      console.log('🖼️ Profile picture URL (SubscriptionPage):', updatedProfile.picture);
    } catch (error) {
      console.error('Error al cargar el perfil del usuario:', error);
    }
  };


  const handleUpgrade = () => {
    setModalAction('upgrade');
    setShowConfirmModal(true);
  };

  const handleDowngrade = () => {
    setModalAction('downgrade');
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    try {
      if (modalAction === 'upgrade') {
        // Upgrade to VIP
        await axios.post('/api/users/vip/upgrade', {}, {
          withCredentials: true
        });
        setSubscriptionData({
          ...subscriptionData,
          tipo: 'VIP',
          fechaInicioVIP: new Date().toISOString().split('T')[0]
        });
        showSuccess('¡Felicidades! Ahora eres un usuario VIP');
      } else {
        // Downgrade to NORMAL and clean VIP content from playlists
        await axios.post('/api/users/vip/downgrade', {}, {
          withCredentials: true
        });
        setSubscriptionData({
          ...subscriptionData,
          tipo: 'NORMAL',
          fechaInicioVIP: null
        });
        showSuccess('Tu suscripción ha sido cancelada. Ahora eres un usuario normal');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      showSuccess('Error de conexión. Por favor, intenta de nuevo.');
    }
    setShowConfirmModal(false);
  };

  const cancelAction = () => {
    setShowConfirmModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  return (
    <div className="subscription-page">
      {/* Animated Background */}
      <div className="animated-bg"></div>
      
      {/* Header */}
      {Capacitor.isNativePlatform() ? (
        <MobileHeader
          userProfile={userProfile}
          handleLogout={handleLogout}
          showSearch={false}
          showFilters={false}
          showNotifications={true}
        />
      ) : (
      <header className={`profile-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          <div className="header-left">
            <button 
              onClick={() => history.push('/usuario')}
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
            <div className="user-menu-container">
              <button
                className="user-avatar-profile"
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="Menú de usuario"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                <img 
                  src={userProfile.picture} 
                  alt="Perfil de usuario" 
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
                {subscriptionData.tipo === 'VIP' && (
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
                    <i className="fas fa-crown" style={{
                      color: '#1a1a2e',
                      fontSize: '12px'
                    }}></i>
                  </div>
                )}
              </button>

              {showUserMenu && (
                <div className="user-dropdown-profile">
                  <Link to="/perfil" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="fas fa-user-circle"></i> Mi Perfil
                  </Link>
                  <Link to="/playlists" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="fas fa-list"></i> Mis Listas
                  </Link>
                  <Link to="/suscripcion" className="dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <i className="fas fa-credit-card"></i> Suscripción
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout-btn">
                    <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      )}
      
      <div className="subscription-container">
        <div className="subscription-box">
          <div className="subscription-header">
            <h1>Mi Suscripción</h1>
            <div className={`subscription-badge ${subscriptionData.tipo.toLowerCase()}`}>
              <i className={`fas ${subscriptionData.tipo === 'VIP' ? 'fa-crown' : 'fa-user'}`}></i>
              <span>{subscriptionData.tipo}</span>
            </div>
          </div>
          
          <div className="subscription-content">
            {/* Tipo de Suscripción */}
            <div className="subscription-section">
              <h2>Estado de tu cuenta</h2>
              <div className="subscription-status">
                <div className="status-item">
                  <label htmlFor="account-type">Tipo de cuenta:</label>
                  <div className="status-value" id="account-type">
                    <span className={`status-chip ${subscriptionData.tipo.toLowerCase()}`}>
                      {subscriptionData.tipo === 'VIP' ? '⭐ Usuario VIP' : '👤 Usuario Normal'}
                    </span>
                  </div>
                </div>
                
                {subscriptionData.tipo === 'VIP' && (
                    <div className="status-item">
                      <label htmlFor="vip-since-date">Miembro VIP desde:</label>
                      <div className="status-value" id="vip-since-date">
                        <span className="date-value">
                          <i className="fas fa-calendar-alt"></i>
                          {' '}
                          {formatDate(subscriptionData.fechaInicioVIP)}
                        </span>
                      </div>
                    </div>
                )}
              </div>
            </div>

            {/* Beneficios VIP */}
            {subscriptionData.tipo === 'VIP' && (
              <div className="subscription-section">
                <h2>Tus beneficios VIP</h2>
                <div className="benefits-list">
                  {subscriptionData.beneficios.map((beneficio, index) => (
                    <div key={index} className="benefit-item">
                      <i className="fas fa-check-circle"></i>
                      <span>{beneficio}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Información para usuarios normales */}
            {subscriptionData.tipo === 'NORMAL' && (
              <div className="subscription-section">
                <h2>Beneficios de ser VIP</h2>
                <div className="upgrade-info">
                  <p className="upgrade-description">
                    Mejora tu experiencia con ESIMEDIA y disfruta de este beneficio exclusivo:
                  </p>
                  <div className="benefits-list">
                    {[
                      'Acceso a contenido exclusivo'
                    ].map((beneficio, index) => (
                      <div key={index} className="benefit-item">
                        <i className="fas fa-star"></i>
                        <span>{beneficio}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="subscription-actions">
              {subscriptionData.tipo === 'VIP' ? (
                <button 
                  className="btn-downgrade"
                  onClick={handleDowngrade}
                >
                  <i className="fas fa-arrow-down"></i>
                  {' '}
                  Cancelar suscripción VIP
                </button>
              ) : (
                <button 
                  className="btn-upgrade"
                  onClick={handleUpgrade}
                >
                  <i className="fas fa-crown"></i>
                  {' '}
                  Hacerse VIP ahora
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div 
          className="modal-overlay" 
          onClick={cancelAction}
          onKeyDown={(e) => { if (e.key === 'Escape') cancelAction(); }}
          role="button"
          tabIndex={0}
          aria-label="Cerrar modal"
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3>
                {modalAction === 'upgrade' 
                  ? '¿Hacerte VIP?' 
                  : '¿Cancelar suscripción VIP?'}
              </h3>
            </div>
            <div className="modal-body">
              <p>
                {modalAction === 'upgrade'
                  ? 'Estás seguro de que deseas actualizar tu cuenta a VIP? Tendrás acceso a contenido exclusivo.'
                  : '¿Estás seguro de que deseas cancelar tu suscripción VIP? Perderás el acceso a contenido exclusivo.'}
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={cancelAction}>
                Cancelar
              </button>
              <button 
                className={modalAction === 'upgrade' ? 'btn-confirm-upgrade' : 'btn-confirm-downgrade'}
                onClick={confirmAction}
              >
                {modalAction === 'upgrade' ? 'Confirmar upgrade' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de notificación (separado del modal de confirmación) */}
      <CustomModal
        isOpen={notificationModal.isOpen}
        onClose={closeNotificationModal}
        onConfirm={notificationModal.onConfirm}
        title={notificationModal.title}
        message={notificationModal.message}
        type={notificationModal.type}
        confirmText={notificationModal.confirmText}
        cancelText={notificationModal.cancelText}
      />
    </div>
  );
}

export default SubscriptionPage;
