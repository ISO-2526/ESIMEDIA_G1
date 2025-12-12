class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
  }

  // Obtener todas las notificaciones
  getNotifications() {
    return [...this.notifications];
  }

  // Añadir una nueva notificación
  addNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      read: false,
      ...notification
    };

    this.notifications.unshift(newNotification); // Añadir al principio (más reciente arriba)
    this.notifyListeners();
    return newNotification;
  }

  // Marcar notificación como leída
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
    }
  }

  // Marcar todas como leídas
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    this.notifyListeners();
  }

  // Eliminar notificación
  removeNotification(notificationId) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifyListeners();
  }

  // Limpiar todas las notificaciones
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Suscribirse a cambios
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notificar a todos los listeners
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }

  // Obtener notificaciones no leídas
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  // Simular carga de notificaciones desde API
  async loadNotifications() {
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Notificaciones de ejemplo
    const mockNotifications = [
      {
        title: "Nuevo contenido disponible",
        message: "Se ha publicado nuevo contenido en tu lista de favoritos",
        type: "content",
        contentId: "691e81f29e8133d307a296a0",
        contentType: "video"
      },
      {
        title: "Actualización de perfil",
        message: "Tu perfil ha sido actualizado correctamente",
        type: "system"
      },
      {
        title: "Contenido recomendado",
        message: "Te recomendamos este nuevo video musical",
        type: "recommendation",
        contentId: "music-456",
        contentType: "audio"
      }
    ];

    // Solo añadir notificaciones que no existan ya (basado en título y mensaje)
    mockNotifications.forEach(notification => {
      const exists = this.notifications.some(existing => 
        existing.title === notification.title && 
        existing.message === notification.message
      );
      
      if (!exists) {
        this.addNotification(notification);
      }
    });

    return this.notifications;
  }
}

// Instancia singleton
const notificationService = new NotificationService();

export default notificationService;