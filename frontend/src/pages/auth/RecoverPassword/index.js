//Pagina recuperar contraseña
import React, { useState } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import api from '../../../api/axiosConfig';
import { useHistory } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useIonRouter } from '@ionic/react';
import './RecoverPassword.css';

function RecoverPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' o 'error'
  const history = useHistory();
  const isMobile = Capacitor.isNativePlatform();

  // Intentar obtener ionRouter para móvil
  let ionRouter = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ionRouter = useIonRouter();
  } catch (e) { }

  // Navegación híbrida
  const navigate = (path) => {
    if (isMobile && ionRouter) {
      ionRouter.push(path, 'forward', 'push');
    } else {
      history.push(path);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();



    try {
      await api.post('/api/auth/recover', { email });
    } catch (error) {
      // Simular delay de 2 segundos
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Siempre mostrar el mismo mensaje
    setMessage('Instrucciones enviadas a tu correo electrónico.');
    setMessageType('success');
  };

  const content = (
    <div className="page-container">
      <div className="recover-wrapper">
        {/* Panel informativo lateral */}
        <div className="recover-info-panel">
          <div className="recover-info-content">
            <div className="recover-info-icon">🔐</div>
            <h2 className="recover-info-title">Recupera tu Cuenta</h2>
            <p className="recover-info-description">
              No te preocupes, te enviaremos un enlace seguro para restablecer tu contraseña.
              Revisa tu correo electrónico y sigue las instrucciones.
            </p>
          </div>
        </div>

        {/* Panel del formulario */}
        <div className="recover-form-panel">
          <h1 className="page-title">Recuperar Contraseña</h1>
          <p className="page-subtitle">
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label htmlFor="recover-email" className="form-label required">Correo Electrónico</label>
              <input
                id="recover-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <button type="submit" className="recover-submit-btn">
              Enviar Instrucciones
            </button>
          </form>

          {message && (
            <p className={`recover-message ${messageType}`}>{message}</p>
          )}

          <div className="recover-form-footer">
            <button
              type="button"
              className="recover-link-btn"
              onClick={() => navigate('/login')}
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
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

export default RecoverPassword;