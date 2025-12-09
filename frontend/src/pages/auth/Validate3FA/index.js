import React, { useState, useEffect, useRef } from "react";
import { IonPage, IonContent } from '@ionic/react';
import { useLocation, useHistory } from "react-router-dom";
import { useIonRouter } from '@ionic/react';
import { Capacitor } from '@capacitor/core';
import axios from "../../../api/axiosConfig";
import './Validate3FA.css';

const Validate3FA = () => {
  const location = useLocation();
  const history = useHistory();
  const isMobile = Capacitor.isNativePlatform();

  // Intentar obtener ionRouter para móvil
  let ionRouter = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    ionRouter = useIonRouter();
  } catch (e) {
    // No está en IonReactRouter context
  }

  // Leer email de location.state o sessionStorage (móvil)
  const getEmail = () => {
    if (location.state?.email) return location.state.email;
    try {
      const navState = JSON.parse(sessionStorage.getItem('navigationState') || '{}');
      return navState.email || '';
    } catch {
      return '';
    }
  };

  const email = getEmail();
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info"); // 'success', 'error', 'info'
  const [sending, setSending] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Navegación híbrida
  const navigate = (path) => {
    console.log('🚀 Validate3FA navegando a:', path);
    if (isMobile && ionRouter) {
      ionRouter.push(path, 'forward', 'push');
    } else {
      history.push(path);
    }
  };

  // Guard para evitar doble envío en StrictMode
  const sentOnceRef = useRef(false);

  const sendCode = async () => {
    if (!email) return;
    if (sending || resendDisabled) return;
    try {
      setSending(true);
      setMessage("Enviando código al correo...");
      setMessageType("info");

      await axios.post("/api/auth/send-3fa-code", { email }, {
        withCredentials: true
      });

      setMessage("Código enviado. Revisa tu correo.");
      setMessageType("success");
      setResendDisabled(true);

      // Deshabilitar reenvío durante 60s para evitar spam
      setTimeout(() => setResendDisabled(false), 60000);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Error al enviar el código. Intenta de nuevo.";
      setMessage(errorMsg);
      setMessageType("error");
    } finally {
      setSending(false);
    }
  };

  // Enviar código automáticamente al montar la página (una sola vez)
  useEffect(() => {
    if (!sentOnceRef.current) {
      sentOnceRef.current = true;
      sendCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidate3FA = async () => {
    if (!code || code.trim().length === 0) {
      setMessage("Por favor, ingresa un código válido");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await axios.post("/api/auth/verify-3fa-code", {
        email,
        code,
      }, {
        withCredentials: true
      });

      const data = response.data;

      // Redirigir según el rol
      if (data.role === "admin") {
        navigate("/adminDashboard");
      } else if (data.role === "creator") {
        navigate("/creator");
      } else {
        navigate("/usuario");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Código incorrecto. Inténtalo de nuevo.";
      setMessage(errorMsg);
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleValidate3FA();
    }
  };

  const content = (
    <div className="page-container">
      <div className="validate3fa-wrapper">
        {/* Panel informativo lateral */}
        <div className="validate3fa-info-panel">
          <div className="validate3fa-info-content">
            <div className="validate3fa-info-icon">📧</div>
            <h2 className="validate3fa-info-title">Verificación por Email</h2>
            <p className="validate3fa-info-description">
              Hemos enviado un código de seguridad a tu correo electrónico.
              Revisa tu bandeja de entrada e ingresa el código para completar el inicio de sesión.
            </p>
            <div className="validate3fa-info-tips">
              <div className="validate3fa-info-tip">
                <span className="validate3fa-tip-icon">📬</span>
                <span>Revisa tu bandeja de entrada</span>
              </div>
              <div className="validate3fa-info-tip">
                <span className="validate3fa-tip-icon">📁</span>
                <span>Verifica también la carpeta de spam</span>
              </div>
              <div className="validate3fa-info-tip">
                <span className="validate3fa-tip-icon">⏰</span>
                <span>El código expira en 10 minutos</span>
              </div>
              <div className="validate3fa-info-tip">
                <span className="validate3fa-tip-icon">🔄</span>
                <span>Puedes reenviar el código si no lo recibes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Panel del contenido principal */}
        <div className="validate3fa-content-panel">
          <h1 className="page-title">Validar 3FA</h1>
          <p className="page-subtitle">
            Introduce el código de verificación que recibiste por correo electrónico.
          </p>

          {email && (
            <div className="validate3fa-email-display">
              <span className="validate3fa-email-icon">✉️</span>
              <div className="validate3fa-email-text">
                Código enviado a: <strong>{email}</strong>
              </div>
            </div>
          )}

          <div className="validate3fa-form-field">
            <label htmlFor="validate3fa-code" className="form-label required">
              Código de Verificación
            </label>
            <input
              id="validate3fa-code"
              type="text"
              className="validate3fa-code-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ingresa el código"
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="validate3fa-info-box">
            <span className="validate3fa-info-box-icon">💡</span>
            <div>
              Copia y pega el código exactamente como aparece en tu correo.
              Si no recibes el código en unos minutos, puedes reenviarlo.
            </div>
          </div>

          <div className="validate3fa-buttons">
            <button
              onClick={handleValidate3FA}
              disabled={isLoading || !code.trim()}
              className="validate3fa-submit-btn"
            >
              {isLoading ? "Verificando..." : "Validar Código"}
            </button>

            <button
              onClick={sendCode}
              disabled={sending || resendDisabled}
              className="validate3fa-resend-btn"
            >
              {sending ? "Enviando..." : resendDisabled ? "Espera 60s" : "Reenviar"}
            </button>
          </div>

          {message && (
            <div className={`validate3fa-message ${messageType}`}>
              {messageType === 'success' && '✓ '}
              {messageType === 'error' && '✗ '}
              {messageType === 'info' && 'ℹ️ '}
              {message}
            </div>
          )}

          <div className="validate3fa-footer">
            <button
              type="button"
              className="validate3fa-link-btn"
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
};

export default Validate3FA;