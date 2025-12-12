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

    // Si tiene contenido, navegar a él
    if (notification.contentId) {
      const routes = {
        video: `/usuario`,
        audio: `/usuario`,
        playlist: `/playlists/${notification.contentId}`
      };

      const route = routes[notification.contentType] || '/usuario';
      
      // Para contenido individual, navegar al dashboard con el ID del contenido
      if (notification.contentType === 'video' || notification.contentType === 'audio') {
        history.push(route, { playContentId: notification.contentId });
      } else {
        history.push(route);
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