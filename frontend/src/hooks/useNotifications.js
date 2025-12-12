import { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import notificationService from '../services/NotificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  // Suscribirse a cambios en las notificaciones
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((updatedNotifications) => {
      setNotifications(updatedNotifications);
    });

    // Cargar notificaciones iniciales
    loadNotifications();

    return unsubscribe;
  }, []);

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      await notificationService.loadNotifications();
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Marcar como leída
  const markAsRead = useCallback((notificationId) => {
    notificationService.markAsRead(notificationId);
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
  }, []);

  // Eliminar notificación
  const removeNotification = useCallback((notificationId) => {
    notificationService.removeNotification(notificationId);
  }, []);

  // Limpiar todas
  const clearAll = useCallback(() => {
    notificationService.clearAll();
  }, []);

  // Manejar clic en notificación
  const handleNotificationClick = useCallback((notification) => {
    // Marcar como leída
    markAsRead(notification.id);

    // Si tiene contenido, disparar evento personalizado para reproducirlo
    if (notification.contentId && notification.contentType) {
      console.log(`🎯 Notificación clickeada - ${notification.contentType} ID: ${notification.contentId}`);
      
      // Disparar evento personalizado que el dashboard escuchará
      const event = new CustomEvent('playContentFromNotification', {
        detail: {
          contentId: notification.contentId,
          contentType: notification.contentType
        }
      });
      window.dispatchEvent(event);
      
      // Si no estamos en /usuario, navegar allí
      if (!window.location.hash.includes('/usuario')) {
        console.log('📍 Navegando a /usuario');
        history.push('/usuario');
      }
    }
  }, [markAsRead, history]);

  // Añadir notificación (para uso interno del sistema)
  const addNotification = useCallback((notification) => {
    return notificationService.addNotification(notification);
  }, []);

  // Obtener conteo de no leídas
  const unreadCount = notificationService.getUnreadCount();

  return {
    notifications,
    loading,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    handleNotificationClick,
    addNotification
  };
};